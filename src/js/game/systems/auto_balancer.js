import { GameSystemWithFilter } from "../game_system_with_filter";
import { THIRDPARTY_URLS } from "../../core/config";
import { DialogWithForm } from "../../core/modal_dialog_elements";
import { FormElementInput } from "../../core/modal_dialog_forms";
import { fillInLinkIntoTranslation } from "../../core/utils";
import { T } from "../../translations";
import { Entity } from "../entity";
import { AutoBalancerComponent } from "../components/auto_balancer";
import { 
    enumDirection, Vector, 
    enumDirectionToVector,
    enumDirectionToAngle,
    enumInvertedDirections,
} from "../../core/vector";
import { Loader } from "../../core/loader";
import { drawRotatedSprite } from "../../core/draw_utils";
import { DrawParameters } from "../../core/draw_parameters";
import { ItemEjectorComponent } from "../components/item_ejector";
import { ItemAcceptorComponent } from "../components/item_acceptor";

export class AutoBalancerSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [AutoBalancerComponent]);
        this.root.signals.entityManuallyPlaced.add(this.recomputeAllEjectorArray, this);
        this.root.signals.entityDestroyed.add(this.recomputeAllEjectorArray, this);
    }

    update() {
        this.recomputeCacheFull();
    }

    recomputeAllEjectorArray() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            if (this.allEntities[i].components.AutoBalancer) {
                const entity = this.allEntities[i];
                const autoBalancerComp = entity.components.AutoBalancer;
                autoBalancerComp.balancerEjectorArray = [];
            }
        }
        for (let i = 0; i < this.allEntities.length; ++i) {
            if (this.allEntities[i].components.AutoBalancer) {
                this.recomputeBalancerEjectorArray(this.allEntities[i]);
            }
        }
    }

    /**
     * Fixes all arrays
     * @param {Entity} entity 
     */
    recomputeBalancerEjectorArray(entity) {
        const PossibleSlots = entity.components.ItemEjector;
        const staticComp = entity.components.StaticMapEntity;
        const autoBalancerComp = entity.components.AutoBalancer;
        const allBalancers = [];

        for (let slotIndex = 0; slotIndex < PossibleSlots.slots.length; ++slotIndex) {
            const ejectorSlot = PossibleSlots.slots[slotIndex];

            const ejectSlotWsTile = staticComp.localTileToWorld(ejectorSlot.pos);
            const ejectSlotWsDirection = staticComp.localDirectionToWorld(ejectorSlot.direction);
            const ejectSlotWsDirectionVector = enumDirectionToVector[ejectSlotWsDirection];
            const ejectSlotTargetWsTile = ejectSlotWsTile.add(ejectSlotWsDirectionVector);

            const targetEntities = this.root.map.getLayersContentsMultipleXY(
                ejectSlotTargetWsTile.x,
                ejectSlotTargetWsTile.y,
            );

            for (let i = 0; i < targetEntities.length; ++i) {
                const targetEntity = targetEntities[i];

                if (targetEntity.components.AutoBalancer && !allBalancers.includes(targetEntity)) {
                    allBalancers.push(targetEntity);
                }

                if (!targetEntity.components.AutoBalancer && !autoBalancerComp.balancerEjectorArray.includes(ejectorSlot)) {
                    autoBalancerComp.balancerEjectorArray.push(ejectorSlot);
                }
            }
        }

        for (let i = 0; i < allBalancers.length; ++i) {
            const nextTargetEntity = allBalancers[i];
            nextTargetEntity.components.AutoBalancer.balancerEjectorArray = entity.components.AutoBalancer.balancerEjectorArray;
            this.recomputeBalancerEjectorArray(nextTargetEntity);
        }
    }

    recomputeCacheFull() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            this.recomputeBalancer(entity);
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
     * @param {Entity} entity
     */
    recomputeBalancer(entity) {
        const PossibleSlots = {
            slots: [
                {
                    pos: new Vector(0, 0),
                    direction: enumDirection.top,
                },
                {
                    pos: new Vector(0, 0),
                    direction: enumDirection.right,
                },
                {
                    pos: new Vector(0, 0),
                    direction: enumDirection.bottom,
                },
                {
                    pos: new Vector(0, 0),
                    direction: enumDirection.left,
                }
            ]
        };
        const staticComp = entity.components.StaticMapEntity;

        const AcceptorSlots = [];
        const EjectorSlots = [];

        for (let slotIndex = 0; slotIndex < PossibleSlots.slots.length; ++slotIndex) {
            const ejectorSlot = PossibleSlots.slots[slotIndex];

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
                ejectSlotTargetWsTile.y,
            );

            for (let i = 0; i < targetEntities.length; ++i) {
                const targetEntity = targetEntities[i];
                
                const targetStaticComp = targetEntity.components.StaticMapEntity;
                const targetBeltComp = targetEntity.components.Belt;
                const targetBalancerComp = targetEntity.components.AutoBalancer;

                // Check for belts (special case)
                if (targetBeltComp) {
                    const beltAcceptingDirection = targetStaticComp.localDirectionToWorld(enumDirection.top);
                    targetBeltComp.assignedPath.onPathChanged();
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

            if (ejectorSlot.cachedBeltPath || ejectorSlot.cachedTargetEntity || ejectorSlot.cachedDestSlot) {
                EjectorSlots.push(ejectorSlot);
            } else {
                AcceptorSlots.push({
                    pos: new Vector(0, 0),
                    directions: [enumDirection[ejectorSlot.direction]],
                });
            }
        }

        if (EjectorSlots.length != 0 && !entity.components.ItemEjector) {
            entity.addComponent(
                new ItemEjectorComponent({
                    slots: [], // set later
                    renderFloatingItems: false,
                })
            );
        }

        if (AcceptorSlots.length != 0 && !entity.components.ItemAcceptor) {
            entity.addComponent(
                new ItemAcceptorComponent({
                    slots: [], // set later
                })
            );
        }

        if (entity.components.ItemAcceptor && entity.components.ItemAcceptor.slots.length != AcceptorSlots.length) {
            entity.components.ItemAcceptor.setSlots(AcceptorSlots);
        }

        if (entity.components.ItemEjector && entity.components.ItemEjector.slots.length != EjectorSlots.length) {
            entity.components.ItemEjector.setSlots(EjectorSlots);
        }
    }

    /**
     * Draws a given chunk
     * @param {import("../../core/draw_utils").DrawParameters} parameters
     */
    drawChunk(parameters, chunk) {
        const contents = chunk.containedEntitiesByLayer.regular;
        for (let i = 0; i < contents.length; ++i) {
            const entity = contents[i];
            if (entity.components.AutoBalancer) {
                this.drawDirectionArrows(parameters, entity);
            }
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
}