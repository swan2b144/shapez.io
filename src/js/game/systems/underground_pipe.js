import { globalConfig } from "../../core/config";
import { Loader } from "../../core/loader";
import { createLogger } from "../../core/logging";
import { Rectangle } from "../../core/rectangle";
import { StaleAreaDetector } from "../../core/stale_area_detector";
import { fastArrayDelete } from "../../core/utils";
import {
    enumAngleToDirection,
    enumDirection,
    enumDirectionToAngle,
    enumDirectionToVector,
    enumInvertedDirections,
} from "../../core/vector";
import { enumUndergroundPipeMode, UndergroundPipeComponent } from "../components/underground_pipe";
import { Entity } from "../entity";
import { GameSystemWithFilter } from "../game_system_with_filter";

const logger = createLogger("piep tunnels");

export class UndergroundPipeSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [UndergroundPipeComponent]);

        this.beltSprites = {
            [enumUndergroundPipeMode.sender]: Loader.getSprite(
                "sprites/buildings/underground_pipe_entry.png"
            ),
            [enumUndergroundPipeMode.receiver]: Loader.getSprite(
                "sprites/buildings/underground_pipe_exit.png"
            ),
        };

        this.staleAreaWatcher = new StaleAreaDetector({
            root: this.root,
            name: "underground-pipe",
            recomputeMethod: this.recomputeArea.bind(this),
        });

        this.root.signals.entityManuallyPlaced.add(this.onEntityManuallyPlaced, this);

        // NOTICE: Once we remove a tunnel, we need to update the whole area to
        // clear outdated handles
        this.staleAreaWatcher.recomputeOnComponentsChanged(
            [UndergroundPipeComponent],
            globalConfig.undergroundPipeMaxTilesByTier[globalConfig.undergroundPipeMaxTilesByTier.length - 1]
        );
    }

    /**
     * Callback when an entity got placed, used to remove belts between underground belts
     * @param {Entity} entity
     */
    onEntityManuallyPlaced(entity) {
        if (!this.root.app.settings.getAllSettings().enableTunnelSmartplace) {
            // Smart-place disabled
            return;
        }

        const undergroundComp = entity.components.UndergroundPipe;
        if (undergroundComp && undergroundComp.mode === enumUndergroundPipeMode.receiver) {
            const staticComp = entity.components.StaticMapEntity;
            const tile = staticComp.origin;

            const direction = enumAngleToDirection[staticComp.rotation];
            const inverseDirection = enumInvertedDirections[direction];
            const offset = enumDirectionToVector[inverseDirection];

            let currentPos = tile.copy();

            const tier = undergroundComp.tier;
            const range = globalConfig.undergroundPipeMaxTilesByTier[tier];

            // FIND ENTRANCE
            // Search for the entrance which is farthest apart (this is why we can't reuse logic here)
            let matchingEntrance = null;
            for (let i = 0; i < range; ++i) {
                currentPos.addInplace(offset);
                const contents = this.root.map.getTileContent(currentPos, entity.layer);
                if (!contents) {
                    continue;
                }

                const contentsUndergroundComp = contents.components.UndergroundPipe;
                const contentsStaticComp = contents.components.StaticMapEntity;
                if (
                    contentsUndergroundComp &&
                    contentsUndergroundComp.tier === undergroundComp.tier &&
                    contentsUndergroundComp.mode === enumUndergroundPipeMode.sender &&
                    enumAngleToDirection[contentsStaticComp.rotation] === direction
                ) {
                    matchingEntrance = {
                        entity: contents,
                        range: i,
                    };
                }
            }

            if (!matchingEntrance) {
                // Nothing found
                return;
            }

            // DETECT OBSOLETE BELTS BETWEEN
            // Remove any belts between entrance and exit which have the same direction,
            // but only if they *all* have the right direction
            currentPos = tile.copy();
            let allPipesMatch = true;
            for (let i = 0; i < matchingEntrance.range; ++i) {
                currentPos.addInplace(offset);

                const contents = this.root.map.getTileContent(currentPos, entity.layer);
                if (!contents) {
                    allPipesMatch = false;
                    break;
                }

                const contentsStaticComp = contents.components.StaticMapEntity;
                const contentsPipeComp = contents.components.Pipe;
                if (!contentsPipeComp) {
                    allPipesMatch = false;
                    break;
                }

                // It's a belt
                if (
                    contentsPipeComp.direction !== enumDirection.top ||
                    enumAngleToDirection[contentsStaticComp.rotation] !== direction
                ) {
                    allPipesMatch = false;
                    break;
                }
            }

            currentPos = tile.copy();
            if (allPipesMatch) {
                // All pipes between this are obsolete, so drop them
                for (let i = 0; i < matchingEntrance.range; ++i) {
                    currentPos.addInplace(offset);
                    const contents = this.root.map.getTileContent(currentPos, entity.layer);
                    assert(contents, "Invalid smart underground pipe logic");
                    this.root.logic.tryDeleteBuilding(contents);
                }
            }

            // REMOVE OBSOLETE TUNNELS
            // Remove any double tunnels, by checking the tile plus the tile above
            currentPos = tile.copy().add(offset);
            for (let i = 0; i < matchingEntrance.range - 1; ++i) {
                const posBefore = currentPos.copy();
                currentPos.addInplace(offset);

                const entityBefore = this.root.map.getTileContent(posBefore, entity.layer);
                const entityAfter = this.root.map.getTileContent(currentPos, entity.layer);

                if (!entityBefore || !entityAfter) {
                    continue;
                }

                const undergroundBefore = entityBefore.components.UndergroundPipe;
                const undergroundAfter = entityAfter.components.UndergroundPipe;

                if (!undergroundBefore || !undergroundAfter) {
                    // Not an underground belt
                    continue;
                }

                if (
                    // Both same tier
                    undergroundBefore.tier !== undergroundAfter.tier ||
                    // And same tier as our original entity
                    undergroundBefore.tier !== undergroundComp.tier
                ) {
                    // Mismatching tier
                    continue;
                }

                if (
                    undergroundBefore.mode !== enumUndergroundPipeMode.sender ||
                    undergroundAfter.mode !== enumUndergroundPipeMode.receiver
                ) {
                    // Not the right mode
                    continue;
                }

                // Check rotations
                const staticBefore = entityBefore.components.StaticMapEntity;
                const staticAfter = entityAfter.components.StaticMapEntity;

                if (
                    enumAngleToDirection[staticBefore.rotation] !== direction ||
                    enumAngleToDirection[staticAfter.rotation] !== direction
                ) {
                    // Wrong rotation
                    continue;
                }

                // All good, can remove
                this.root.logic.tryDeleteBuilding(entityBefore);
                this.root.logic.tryDeleteBuilding(entityAfter);
            }
        }
    }

    /**
     * Recomputes the cache in the given area, invalidating all entries there
     * @param {Rectangle} area
     */
    recomputeArea(area) {
        for (let x = area.x; x < area.right(); ++x) {
            for (let y = area.y; y < area.bottom(); ++y) {
                const entities = this.root.map.getLayersContentsMultipleXY(x, y);
                for (let i = 0; i < entities.length; ++i) {
                    const entity = entities[i];
                    const undergroundComp = entity.components.UndergroundPipe;
                    if (!undergroundComp) {
                        continue;
                    }
                    undergroundComp.cachedLinkedEntity = null;
                }
            }
        }
    }

    update() {
        this.staleAreaWatcher.update();

        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            const undergroundComp = entity.components.UndergroundPipe;
            if (undergroundComp.mode === enumUndergroundPipeMode.sender) {
                this.handleSender(entity);
            } else {
                this.handleReceiver(entity);
            }
        }
    }

    /**
     * Finds the receiver for a given sender
     * @param {Entity} entity
     * @returns {import("../components/underground_pipe").LinkedUndergroundPipe}
     */
    findRecieverForSender(entity) {
        const staticComp = entity.components.StaticMapEntity;
        const undergroundComp = entity.components.UndergroundPipe;
        const searchDirection = staticComp.localDirectionToWorld(enumDirection.top);
        const searchVector = enumDirectionToVector[searchDirection];
        const targetRotation = enumDirectionToAngle[searchDirection];
        let currentTile = staticComp.origin;

        // Search in the direction of the tunnel
        for (
            let searchOffset = 0;
            searchOffset < globalConfig.undergroundPipeMaxTilesByTier[undergroundComp.tier];
            ++searchOffset
        ) {
            currentTile = currentTile.add(searchVector);

            const potentialReceiver = this.root.map.getTileContent(currentTile, "regular");
            if (!potentialReceiver) {
                // Empty tile
                continue;
            }
            const receiverUndergroundComp = potentialReceiver.components.UndergroundPipe;
            if (!receiverUndergroundComp || receiverUndergroundComp.tier !== undergroundComp.tier) {
                // Not a tunnel, or not on the same tier
                continue;
            }

            const receiverStaticComp = potentialReceiver.components.StaticMapEntity;
            if (receiverStaticComp.rotation !== targetRotation) {
                // Wrong rotation
                continue;
            }

            if (receiverUndergroundComp.mode !== enumUndergroundPipeMode.receiver) {
                // Not a receiver, but a sender -> Abort to make sure we don't deliver double
                break;
            }

            return { entity: potentialReceiver, distance: searchOffset };
        }

        // None found
        return { entity: null, distance: 0 };
    }

    /**
     *
     * @param {Entity} entity
     */
    handleSender(entity) {
        const undergroundComp = entity.components.UndergroundPipe;

        // Find the current receiver
        let cacheEntry = undergroundComp.cachedLinkedEntity;
        if (!cacheEntry) {
            // Need to recompute cache
            cacheEntry = undergroundComp.cachedLinkedEntity = this.findRecieverForSender(entity);
        }

        if (!cacheEntry.entity) {
            // If there is no connection to a receiver, ignore this one
            return;
        }

        // Check if we have any items to eject
        const nextItemAndDuration = undergroundComp.pendingfluids[0];
        if (nextItemAndDuration) {
            assert(undergroundComp.pendingfluids.length === 1, "more than 1 pending");

            // Check if the receiver can accept it
            if (
                cacheEntry.entity.components.UndergroundPipe.tryAcceptTunneledItem(
                    nextItemAndDuration[0],
                    cacheEntry.distance,
                    this.root.hubGoals.getUndergroundPipeBaseSpeed(),
                    this.root.time.now()
                )
            ) {
                // Drop this item
                fastArrayDelete(undergroundComp.pendingfluids, 0);
            }
        }
    }

    /**
     *
     * @param {Entity} entity
     */
    handleReceiver(entity) {
        const undergroundComp = entity.components.UndergroundPipe;

        // Try to eject items, we only check the first one because it is sorted by remaining time
        const nextItemAndDuration = undergroundComp.pendingfluids[0];
        if (nextItemAndDuration) {
            if (this.root.time.now() > nextItemAndDuration[1]) {
                const ejectorComp = entity.components.FluidEjector;

                const nextSlotIndex = ejectorComp.getFirstFreeSlot();
                if (nextSlotIndex !== null) {
                    if (ejectorComp.tryEject(nextSlotIndex, nextItemAndDuration[0])) {
                        undergroundComp.pendingfluids.shift();
                    }
                }
            }
        }
    }
}
