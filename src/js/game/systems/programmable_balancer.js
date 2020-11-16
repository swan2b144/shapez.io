import { GameSystemWithFilter } from "../game_system_with_filter";
import { THIRDPARTY_URLS } from "../../core/config";
import { DialogWithForm } from "../../core/modal_dialog_elements";
import { FormElementInput } from "../../core/modal_dialog_forms";
import { fillInLinkIntoTranslation } from "../../core/utils";
import { T } from "../../translations";
import { Entity } from "../entity";
import { ProgrammableBalancerComponent } from "../components/programmable_balancer";
import { 
    enumDirection, Vector, 
    enumDirectionToVector,
    enumDirectionToAngle,
    enumInvertedDirections,
} from "../../core/vector";
import { Loader } from "../../core/loader";
import { drawRotatedSprite } from "../../core/draw_utils";
import { DrawParameters } from "../../core/draw_parameters";

export class ProgrammableBalancerSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [ProgrammableBalancerComponent]);

        this.root.signals.postLoadHook.add(this.fixAllComponents, this);
        this.root.signals.entityManuallyPlaced.add(this.channelSignalValue, this);
    }

    update() {
        this.recomputeCacheFull();
        for (const entity in this.allEntities) {
            if (this.allEntities[entity].components.ItemEjector.slots.length == 0) {
                this.fixComponents(this.allEntities[entity]);
            }
        }
    }

    fixAllComponents() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            this.fixComponents(this.allEntities[i]);
        }
    }

    /**
     * Tests word for balancer
     * @param { string } word 
     */
    testSignal(word) {
        // If word isn't 4 letter it will return false
        const words = word.split("/");
        if (words.length != 4) {
            return false;
        }

        this.sides = {
            top: words[0],
            right: words[1],
            bottom: words[2],
            left: words[3],
        };

        // Test for all sides and if there is a word diffrent than 0 or 1 return false
        for (const side in this.sides) {
            if (this.sides[side] != "in" && this.sides[side] != "out") {
                return false;
            }
        }

        this.word = word;

        // If it passes all tests return true
        return true;
    }

    /**
     * Recomputes the whole cache after the game has loaded
     */
    recomputeCacheFull() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            this.recomputeSingleEntityCache(entity);
        }
    }

    /**
     * @param {Entity} entity
     */
    recomputeSingleEntityCache(entity) {
        const ejectorComp = entity.components.ItemEjector;
        const staticComp = entity.components.StaticMapEntity;

        for (let slotIndex = 0; slotIndex < ejectorComp.slots.length; ++slotIndex) {
            const ejectorSlot = ejectorComp.slots[slotIndex];

            // Clear the old cache.
            ejectorSlot.cachedDestSlot = null;
            ejectorSlot.cachedTargetEntity = null;
            ejectorSlot.cachedBeltPath = null;

            // Figure out where and into which direction we eject items
            const ejectSlotWsTile = staticComp.localTileToWorld(ejectorSlot.pos);
            const ejectSlotWsDirection = staticComp.localDirectionToWorld(ejectorSlot.direction);
            const ejectSlotWsDirectionVector = enumDirectionToVector[ejectSlotWsDirection];
            const ejectSlotTargetWsTile = ejectSlotWsTile.add(ejectSlotWsDirectionVector);

            // Try to find the given acceptor component to take the item
            // Since there can be cross layer dependencies, check on all layers
            const targetEntities = this.root.map.getLayersContentsMultipleXY(
                ejectSlotTargetWsTile.x,
                ejectSlotTargetWsTile.y
            );

            for (let i = 0; i < targetEntities.length; ++i) {
                const targetEntity = targetEntities[i];

                const targetStaticComp = targetEntity.components.StaticMapEntity;
                const targetBeltComp = targetEntity.components.Belt;

                // Check for belts (special case)
                if (targetBeltComp) {
                    const beltAcceptingDirection = targetStaticComp.localDirectionToWorld(enumDirection.top);
                    if (ejectSlotWsDirection === beltAcceptingDirection) {
                        ejectorSlot.cachedTargetEntity = targetEntity;
                        ejectorSlot.cachedBeltPath = targetBeltComp.assignedPath;
                        break;
                    }
                }

                // Check for item acceptors
                const targetAcceptorComp = targetEntity.components.ItemAcceptor;
                if (!targetAcceptorComp) {
                    // Entity doesn't accept items
                    continue;
                }

                const matchingSlot = targetAcceptorComp.findMatchingSlot(
                    targetStaticComp.worldToLocalTile(ejectSlotTargetWsTile),
                    targetStaticComp.worldDirectionToLocal(ejectSlotWsDirection)
                );

                if (!matchingSlot) {
                    // No matching slot found
                    continue;
                }

                // A slot can always be connected to one other slot only
                ejectorSlot.cachedTargetEntity = targetEntity;
                ejectorSlot.cachedDestSlot = matchingSlot;
                break;
            }
        }
    }

    /**
     * Sets components of entity
     * @param {*} entity 
     */
    fixComponents(entity) {
        if (entity.components.ProgrammableBalancer.word) {
            this.testSignal(entity.components.ProgrammableBalancer.word);
            const AcceptorSlots = [];
            const EjectorSlots = [];
            for (const side in this.sides) {
                if (this.sides[side] == "in") {
                    AcceptorSlots.push({
                        pos: new Vector(0, 0),
                        directions: [enumDirection[side]],
                    });
                } else if (this.sides[side] == "out") { 
                    EjectorSlots.push({
                        pos: new Vector(0, 0),
                        direction: enumDirection[side],
                    });
                }
            }
    
            if (entity.components.ItemAcceptor) {
                entity.components.ItemAcceptor.setSlots(AcceptorSlots);
            }
    
            if (entity.components.ItemEjector) {
                entity.components.ItemEjector.setSlots(EjectorSlots);
            }
        }
    }

    /**
     * Asks the entity to enter a valid signal code
     * @param {Entity} entity
     */
    channelSignalValue(entity) {
        if (entity.components.ProgrammableBalancer) {
            // Ok, query, but also save the uid because it could get stale
            const uid = entity.uid;

            const signalValueInput = new FormElementInput({
                id: "channelValue",
                label: fillInLinkIntoTranslation(T.dialogs.editBalancer.descShortKey, THIRDPARTY_URLS.shapeViewer),
                placeholder: "",
                defaultValue: "",
                validator: val => this.testSignal(val),
            });

            const dialog = new DialogWithForm({
                app: this.root.app,
                title: T.dialogs.editBalancer.title,
                desc: "",
                formElements: [signalValueInput],
                buttons: ["cancel:bad:escape", "ok:good:enter"],
                closeButton: false,
            });
            this.root.hud.parts.dialogs.internalShowDialog(dialog);

            // When confirmed, set the signal
            const closeHandler = () => {
                if (!this.root || !this.root.entityMgr) {
                    // Game got stopped
                    return;
                }

                const entityRef = this.root.entityMgr.findByUid(uid, false);
                if (!entityRef) {
                    // outdated
                    return;
                }

                const constantComp = entityRef.components.ProgrammableBalancer;
                if (!constantComp) {
                    // no longer interesting
                    return;
                }

                if (signalValueInput.getValue()) {
                    this.fixComponents(entity);
                }

                entity.components.ProgrammableBalancer.word = this.word;
            };

            dialog.buttonSignals.ok.add(closeHandler);
            dialog.valueChosen.add(closeHandler);

            // When cancelled, destroy the entity again
            dialog.buttonSignals.cancel.add(() => {
                if (!this.root || !this.root.entityMgr) {
                    // Game got stopped
                    return;
                }

                const entityRef = this.root.entityMgr.findByUid(uid, false);
                if (!entityRef) {
                    // outdated
                    return;
                }

                const constantComp = entityRef.components.ProgrammableBalancer;
                if (!constantComp) {
                    // no longer interesting
                    return;
                }

                this.root.logic.tryDeleteBuilding(entityRef);
            });
        }
    }

    /**
     * Computes the color below the current tile
     * @returns {object}
     */
    computeChannelBelowTile() {
        const mousePosition = this.root.app.mousePosition;
        if (!mousePosition) {
            // Not on screen
            return null;
        }

        const worldPos = this.root.camera.screenToWorld(mousePosition);
        const tile = worldPos.toTileSpace();
        const contents = this.root.map.getTileContent(tile, "regular");

        if (contents && contents.components.ProgrammableBalancer) {
            // We hovered a lower layer, show the sides there
            return contents;
        }

        return null;
    }

    /**
     * Draws a given chunk
     * @param {import("../../core/draw_utils").DrawParameters} parameters
     */
    drawChunk(parameters, chunk) {
        const contents = chunk.containedEntitiesByLayer.regular;
        for (let i = 0; i < contents.length; ++i) {
            const entity = contents[i];
            if (entity.components.ProgrammableBalancer) {
                this.drawDirectionArrows(parameters, entity);
            }
        }
        const entity = this.computeChannelBelowTile();
        if (entity) {
            this.drawMatchingAcceptorsAndEjectors(parameters, entity);
        }
    }

    /**
     * @param {DrawParameters} parameters
     * @param {object} entity
     */
    drawDirectionArrows(parameters, entity) {
        const acceptorComp = entity.components.ItemAcceptor;
        const ejectorComp = entity.components.ItemEjector;
        const staticComp = entity.components.StaticMapEntity;
        const directionArrowSprite = Loader.getSprite("sprites/misc/slot_direction_arrow.png");

        // Just ignore the following code please ... thanks!

        const offsetShift = -4;

        let acceptorSlots = [];
        let ejectorSlots = [];

        if (ejectorComp) {
            ejectorSlots = ejectorComp.slots.slice();
        }

        if (acceptorComp) {
            acceptorSlots = acceptorComp.slots.slice();
        }

        for (let acceptorSlotIndex = 0; acceptorSlotIndex < acceptorSlots.length; ++acceptorSlotIndex) {
            const slot = acceptorSlots[acceptorSlotIndex];

            const acceptorSlotWsTile = staticComp.localTileToWorld(slot.pos);
            const acceptorSlotWsPos = acceptorSlotWsTile.toWorldSpaceCenterOfTile();

            // Go over all slots
            for (
                let acceptorDirectionIndex = 0;
                acceptorDirectionIndex < slot.directions.length;
                ++acceptorDirectionIndex
            ) {
                const direction = slot.directions[acceptorDirectionIndex];
                const worldDirection = staticComp.localDirectionToWorld(direction);

                // Figure out which tile ejects to this slot
                const sourceTile = acceptorSlotWsTile.add(enumDirectionToVector[worldDirection]);

                let isBlocked = false;
                let isConnected = false;

                // Find all entities which are on that tile
                const sourceEntities = this.root.map.getLayersContentsMultipleXY(sourceTile.x, sourceTile.y);

                // Check for every entity:
                for (let i = 0; i < sourceEntities.length; ++i) {
                    const sourceEntity = sourceEntities[i];
                    const sourceEjector = sourceEntity.components.ItemEjector;
                    const sourceBeltComp = sourceEntity.components.Belt;
                    const sourceStaticComp = sourceEntity.components.StaticMapEntity;
                    const ejectorAcceptLocalTile = sourceStaticComp.worldToLocalTile(acceptorSlotWsTile);

                    // If this entity is on the same layer as the slot - if so, it can either be
                    // connected, or it can not be connected and thus block the input
                    if (sourceEjector && sourceEjector.anySlotEjectsToLocalTile(ejectorAcceptLocalTile)) {
                        // This one is connected, all good
                        isConnected = true;
                    } else if (
                        sourceBeltComp &&
                        sourceStaticComp.localDirectionToWorld(sourceBeltComp.direction) ===
                            enumInvertedDirections[worldDirection]
                    ) {
                        // Belt connected
                        isConnected = true;
                    } else {
                        // This one is blocked
                        isBlocked = true;
                    }
                }

                const alpha = isConnected || isBlocked ? 1.0 : 0.3;
                const sprite = directionArrowSprite;

                parameters.context.globalAlpha = alpha;
                drawRotatedSprite({
                    parameters,
                    sprite,
                    x: acceptorSlotWsPos.x,
                    y: acceptorSlotWsPos.y,
                    angle: Math.radians(enumDirectionToAngle[enumInvertedDirections[worldDirection]]),
                    size: 13,
                    offsetY: offsetShift + 13,
                });
                parameters.context.globalAlpha = 1;
            }
        }

        // Go over all slots
        for (let ejectorSlotIndex = 0; ejectorSlotIndex < ejectorSlots.length; ++ejectorSlotIndex) {
            const slot = ejectorSlots[ejectorSlotIndex];

            const ejectorSlotLocalTile = slot.pos.add(enumDirectionToVector[slot.direction]);
            const ejectorSlotWsTile = staticComp.localTileToWorld(ejectorSlotLocalTile);

            const ejectorSLotWsPos = ejectorSlotWsTile.toWorldSpaceCenterOfTile();
            const ejectorSlotWsDirection = staticComp.localDirectionToWorld(slot.direction);

            let isBlocked = false;
            let isConnected = false;

            // Find all entities which are on that tile
            const destEntities = this.root.map.getLayersContentsMultipleXY(
                ejectorSlotWsTile.x,
                ejectorSlotWsTile.y
            );

            // Check for every entity:
            for (let i = 0; i < destEntities.length; ++i) {
                const destEntity = destEntities[i];
                const destAcceptor = destEntity.components.ItemAcceptor;
                const destStaticComp = destEntity.components.StaticMapEntity;

                const destLocalTile = destStaticComp.worldToLocalTile(ejectorSlotWsTile);
                const destLocalDir = destStaticComp.worldDirectionToLocal(ejectorSlotWsDirection);
                if (destAcceptor && destAcceptor.findMatchingSlot(destLocalTile, destLocalDir)) {
                    // This one is connected, all good
                    isConnected = true;
                } else if (destEntity.components.Belt && destLocalDir === enumDirection.top) {
                    // Connected to a belt
                    isConnected = true;
                } else {
                    // This one is blocked
                    isBlocked = true;
                }
            }

            const alpha = isConnected || isBlocked ? 1.0 : 0.3;
            const sprite = directionArrowSprite;

            parameters.context.globalAlpha = alpha;
            drawRotatedSprite({
                parameters,
                sprite,
                x: ejectorSLotWsPos.x,
                y: ejectorSLotWsPos.y,
                angle: Math.radians(enumDirectionToAngle[ejectorSlotWsDirection]),
                size: 13,
                offsetY: offsetShift + 26.5,
            });
            parameters.context.globalAlpha = 1;
        }
    }

    /**
     * @param {DrawParameters} parameters
     * @param {object} entity
     */
    drawMatchingAcceptorsAndEjectors(parameters, entity) {
        const acceptorComp = entity.components.ItemAcceptor;
        const ejectorComp = entity.components.ItemEjector;
        const staticComp = entity.components.StaticMapEntity;

        const goodArrowSprite = Loader.getSprite("sprites/misc/slot_good_arrow.png");
        const badArrowSprite = Loader.getSprite("sprites/misc/slot_bad_arrow.png");

        // Just ignore the following code please ... thanks!

        const offsetShift = 10;

        let acceptorSlots = [];
        let ejectorSlots = [];

        if (ejectorComp) {
            ejectorSlots = ejectorComp.slots.slice();
        }

        if (acceptorComp) {
            acceptorSlots = acceptorComp.slots.slice();
        }

        for (let acceptorSlotIndex = 0; acceptorSlotIndex < acceptorSlots.length; ++acceptorSlotIndex) {
            const slot = acceptorSlots[acceptorSlotIndex];

            const acceptorSlotWsTile = staticComp.localTileToWorld(slot.pos);
            const acceptorSlotWsPos = acceptorSlotWsTile.toWorldSpaceCenterOfTile();

            // Go over all slots
            for (
                let acceptorDirectionIndex = 0;
                acceptorDirectionIndex < slot.directions.length;
                ++acceptorDirectionIndex
            ) {
                const direction = slot.directions[acceptorDirectionIndex];
                const worldDirection = staticComp.localDirectionToWorld(direction);

                // Figure out which tile ejects to this slot
                const sourceTile = acceptorSlotWsTile.add(enumDirectionToVector[worldDirection]);

                let isBlocked = false;
                let isConnected = false;

                // Find all entities which are on that tile
                const sourceEntities = this.root.map.getLayersContentsMultipleXY(sourceTile.x, sourceTile.y);

                // Check for every entity:
                for (let i = 0; i < sourceEntities.length; ++i) {
                    const sourceEntity = sourceEntities[i];
                    const sourceEjector = sourceEntity.components.ItemEjector;
                    const sourceBeltComp = sourceEntity.components.Belt;
                    const sourceStaticComp = sourceEntity.components.StaticMapEntity;
                    const ejectorAcceptLocalTile = sourceStaticComp.worldToLocalTile(acceptorSlotWsTile);

                    // If this entity is on the same layer as the slot - if so, it can either be
                    // connected, or it can not be connected and thus block the input
                    if (sourceEjector && sourceEjector.anySlotEjectsToLocalTile(ejectorAcceptLocalTile)) {
                        // This one is connected, all good
                        isConnected = true;
                    } else if (
                        sourceBeltComp &&
                        sourceStaticComp.localDirectionToWorld(sourceBeltComp.direction) ===
                            enumInvertedDirections[worldDirection]
                    ) {
                        // Belt connected
                        isConnected = true;
                    } else {
                        // This one is blocked
                        isBlocked = true;
                    }
                }

                const alpha = isConnected || isBlocked ? 1.0 : 0.3;
                const sprite = isBlocked ? badArrowSprite : goodArrowSprite;

                parameters.context.globalAlpha = alpha;
                drawRotatedSprite({
                    parameters,
                    sprite,
                    x: acceptorSlotWsPos.x,
                    y: acceptorSlotWsPos.y,
                    angle: Math.radians(enumDirectionToAngle[enumInvertedDirections[worldDirection]]),
                    size: 13,
                    offsetY: offsetShift + 13,
                });
                parameters.context.globalAlpha = 1;
            }
        }

        // Go over all slots
        for (let ejectorSlotIndex = 0; ejectorSlotIndex < ejectorSlots.length; ++ejectorSlotIndex) {
            const slot = ejectorSlots[ejectorSlotIndex];

            const ejectorSlotLocalTile = slot.pos.add(enumDirectionToVector[slot.direction]);
            const ejectorSlotWsTile = staticComp.localTileToWorld(ejectorSlotLocalTile);

            const ejectorSLotWsPos = ejectorSlotWsTile.toWorldSpaceCenterOfTile();
            const ejectorSlotWsDirection = staticComp.localDirectionToWorld(slot.direction);

            let isBlocked = false;
            let isConnected = false;

            // Find all entities which are on that tile
            const destEntities = this.root.map.getLayersContentsMultipleXY(
                ejectorSlotWsTile.x,
                ejectorSlotWsTile.y
            );

            // Check for every entity:
            for (let i = 0; i < destEntities.length; ++i) {
                const destEntity = destEntities[i];
                const destAcceptor = destEntity.components.ItemAcceptor;
                const destStaticComp = destEntity.components.StaticMapEntity;
                const destMiner = destEntity.components.Miner;

                const destLocalTile = destStaticComp.worldToLocalTile(ejectorSlotWsTile);
                const destLocalDir = destStaticComp.worldDirectionToLocal(ejectorSlotWsDirection);
                if (destAcceptor && destAcceptor.findMatchingSlot(destLocalTile, destLocalDir)) {
                    // This one is connected, all good
                    isConnected = true;
                } else if (destEntity.components.Belt && destLocalDir === enumDirection.top) {
                    // Connected to a belt
                    isConnected = true;
                } else {
                    // This one is blocked
                    isBlocked = true;
                }
            }

            const alpha = isConnected || isBlocked ? 1.0 : 0.3;
            const sprite = isBlocked ? badArrowSprite : goodArrowSprite;

            parameters.context.globalAlpha = alpha;
            drawRotatedSprite({
                parameters,
                sprite,
                x: ejectorSLotWsPos.x,
                y: ejectorSLotWsPos.y,
                angle: Math.radians(enumDirectionToAngle[ejectorSlotWsDirection]),
                size: 13,
                offsetY: offsetShift,
            });
            parameters.context.globalAlpha = 1;
        }
    }
}

