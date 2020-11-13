import { formatItemsPerSecond, generateMatrixRotations } from "../../core/utils";
import { enumDirection, Vector } from "../../core/vector";
import { T } from "../../translations";
import { InverseFilterComponent } from "../components/inverse_filter";
import { FilterComponent } from "../components/filter";
import { ItemAcceptorComponent } from "../components/item_acceptor";
import { ItemEjectorComponent } from "../components/item_ejector";
import { enumPinSlotType, WiredPinsComponent } from "../components/wired_pins";
import { Entity } from "../entity";
import { MetaBuilding, defaultBuildingVariant } from "../meta_building";
import { GameRoot } from "../root";
import { enumHubGoalRewards } from "../tutorial_goals";

/** @enum {string} */
export const enumFilterVariants = {
    filterInverse: "filter_inverse",
    compactFilter: "compact_filter",
    compactFilterInverse: "compact_filter_inverse",
};

const overlayMatrices = {
    [defaultBuildingVariant]: null,
    [enumFilterVariants.filterInverse]: null,
    [enumFilterVariants.compactFilter]: null,
    [enumFilterVariants.compactFilterInverse]: generateMatrixRotations([0, 1, 0, 0, 1, 1, 0, 1, 0]),
};

export class MetaFilterBuilding extends MetaBuilding {
    constructor() {
        super("filter");
    }

    getSilhouetteColor() {
        return "#c45c2e";
    }

    getDimensions(variant) {
        switch (variant) {
            case defaultBuildingVariant:
            case enumFilterVariants.filterInverse:
                return new Vector(2, 1);
            case enumFilterVariants.compactFilter:
            case enumFilterVariants.compactFilterInverse:
                return new Vector(1, 1);
            default:
                assertAlways(false, "Unknown balancer variant: " + variant);
        }
    }

    /**
     * @param {GameRoot} root
     */
    getAvailableVariants(root) {
        this.moreFiltersMod = root.app.settings.getAllSettings().moreFiltersMod;

        let available = [defaultBuildingVariant];

        // Dont unlock compact balancers if there is programmable balancer already.
        if (this.moreFiltersMod) {
            if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_filter)) {
                available.push(enumFilterVariants.filterInverse, enumFilterVariants.compactFilter, enumFilterVariants.compactFilterInverse);
            }
        }

        return available;
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_filter);
    }

    getShowWiresLayerPreview() {
        return true;
    }

    /**
     * @param {number} rotation
     * @param {number} rotationVariant
     * @param {string} variant
     * @param {Entity} entity
     * @returns {Array<number>|null}
     */
    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant, entity) {
        const matrix = overlayMatrices[variant];
        if (matrix) {
            return matrix[rotation];
        }
        return null;
    }

    /**
     * @param {GameRoot} root
     * @param {string} variant
     * @returns {Array<[string, string]>}
     */
    getAdditionalStatistics(root, variant) {
        const beltSpeed = root.hubGoals.getBeltBaseSpeed();
        return [[T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(beltSpeed)]];
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(
            new WiredPinsComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.left,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ],
            })
        );

        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        directions: [enumDirection.bottom],
                    },
                ],
            })
        );

        entity.addComponent(
            new ItemEjectorComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                    },
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.right,
                    },
                ],
            })
        );

        entity.addComponent(new FilterComponent());
    }

        /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    updateVariants(entity, rotationVariant, variant) {
        switch (variant) {
            case defaultBuildingVariant:
            case enumFilterVariants.filterInverse: {
                entity.components.WiredPins.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.left,
                        type: enumPinSlotType.logicalAcceptor,
                    }
                ]);

                entity.components.ItemAcceptor.setSlots([
                    {
                        pos: new Vector(0, 0),
                        directions: [enumDirection.bottom],
                    }
                ]);

                entity.components.ItemEjector.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                    },
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.right,
                    },
                ]);

                if (variant == enumFilterVariants.filterInverse && !entity.components.InverseFilter) {
                    entity.addComponent(new InverseFilterComponent());
                }

                break;
            }
            case enumFilterVariants.compactFilter:
            case enumFilterVariants.compactFilterInverse: {
                entity.components.ItemAcceptor.setSlots([
                    { 
                        pos: new Vector(0, 0), 
                        directions: [enumDirection.bottom] 
                    }
                ]);

                entity.components.ItemEjector.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.right,
                    },
                ]);

                if (variant == enumFilterVariants.compactFilterInverse && !entity.components.InverseFilter) {
                    entity.addComponent(new InverseFilterComponent());
                }

                break;
            }
            default:
                assertAlways(false, "Unknown balancer variant: " + variant);
        }
    }
}
