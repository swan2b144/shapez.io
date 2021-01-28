import { Loader } from "../../core/loader";
import { enumDirection, Vector, enumAngleToDirection, enumDirectionToVector } from "../../core/vector";
import { FluidAcceptorComponent } from "../components/fluid_acceptor";
import { FluidEjectorComponent } from "../components/fluid_ejector";
import { enumUndergroundPipeMode, UndergroundPipeComponent } from "../components/underground_pipe";
import { Entity } from "../entity";
import { MetaBuilding, defaultBuildingVariant } from "../meta_building";
import { GameRoot } from "../root";
import { globalConfig } from "../../core/config";
import { enumHubGoalRewards } from "../tutorial_goals";
import { formatItemsPerSecond, generateMatrixRotations } from "../../core/utils";
import { T } from "../../translations";

/** @enum {string} */
export const arrayUndergroundRotationVariantToMode = [
    enumUndergroundPipeMode.sender,
    enumUndergroundPipeMode.receiver,
];

/** @enum {string} */
export const enumUndergroundPipeVariants = { tier2: "tier2" };

export const enumUndergroundPipeVariantToTier = {
    [defaultBuildingVariant]: 0,
    [enumUndergroundPipeVariants.tier2]: 1,
};

const colorsByRotationVariant = ["#6d9dff", "#71ff9c"];

const overlayMatrices = [
    // Sender
    generateMatrixRotations([1, 1, 1, 0, 1, 0, 0, 1, 0]),

    // Receiver
    generateMatrixRotations([0, 1, 0, 0, 1, 0, 1, 1, 1]),
];

export class MetaUndergroundPipeBuilding extends MetaBuilding {
    constructor() {
        super("underground_pipe");
    }

    getSilhouetteColor(variant, rotationVariant) {
        return colorsByRotationVariant[rotationVariant];
    }

    getFlipOrientationAfterPlacement() {
        return true;
    }

    getStayInPlacementMode() {
        return true;
    }
    isPlaceableToFluids() {
        return false;
    }
    isPlaceableToGround() {
        return true;
    }

    /**
     * @param {number} rotation
     * @param {number} rotationVariant
     * @param {string} variant
     * @param {Entity} entity
     */
    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant, entity) {
        return overlayMatrices[rotationVariant][rotation];
    }

    /**
     * @param {GameRoot} root
     * @param {string} variant
     * @returns {Array<[string, string]>}
     */
    getAdditionalStatistics(root, variant) {
        const rangeTiles =
            globalConfig.undergroundPipeMaxTilesByTier[enumUndergroundPipeVariantToTier[variant]];

        const pipeSpeed = root.hubGoals.getUndergroundPipeBaseSpeed();
        return [
            [
                T.ingame.buildingPlacement.infoTexts.range,
                T.ingame.buildingPlacement.infoTexts.tiles.replace("<x>", "" + rangeTiles),
            ],
            [T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(pipeSpeed)],
        ];
    }

    /**
     * @param {GameRoot} root
     */
    getAvailableVariants(root) {
        if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_underground_pipe_tier_2)) {
            return [defaultBuildingVariant, enumUndergroundPipeVariants.tier2];
        }
        return super.getAvailableVariants(root);
    }

    /**
     * @param {number} rotationVariant
     * @param {string} variant
     */
    getPreviewSprite(rotationVariant, variant) {
        let suffix = "";
        if (variant !== defaultBuildingVariant) {
            suffix = "-" + variant;
        }

        switch (arrayUndergroundRotationVariantToMode[rotationVariant]) {
            case enumUndergroundPipeMode.sender:
                return Loader.getSprite("sprites/buildings/underground_pipe_entry" + suffix + ".png");
            case enumUndergroundPipeMode.receiver:
                return Loader.getSprite("sprites/buildings/underground_pipe_exit" + suffix + ".png");
            default:
                assertAlways(false, "Invalid rotation variant");
        }
    }

    /**
     * @param {number} rotationVariant
     * @param {string} variant
     */
    getBlueprintSprite(rotationVariant, variant) {
        let suffix = "";
        if (variant !== defaultBuildingVariant) {
            suffix = "-" + variant;
        }

        switch (arrayUndergroundRotationVariantToMode[rotationVariant]) {
            case enumUndergroundPipeMode.sender:
                return Loader.getSprite("sprites/blueprints/underground_pipe_entry" + suffix + ".png");
            case enumUndergroundPipeMode.receiver:
                return Loader.getSprite("sprites/blueprints/underground_pipe_exit" + suffix + ".png");
            default:
                assertAlways(false, "Invalid rotation variant");
        }
    }

    /**
     * @param {number} rotationVariant
     * @param {string} variant
     */
    getSprite(rotationVariant, variant) {
        return this.getPreviewSprite(rotationVariant, variant);
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_tunnel);
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        // Required, since the item processor needs this.
        entity.addComponent(
            new FluidEjectorComponent({
                slots: [],
            })
        );

        entity.addComponent(new UndergroundPipeComponent({}));
        entity.addComponent(
            new FluidAcceptorComponent({
                slots: [],
            })
        );
    }

    /**
     * Should compute the optimal rotation variant on the given tile
     * @param {object} param0
     * @param {GameRoot} param0.root
     * @param {Vector} param0.tile
     * @param {number} param0.rotation
     * @param {string} param0.variant
     * @param {Layer} param0.layer
     * @return {{ rotation: number, rotationVariant: number, connectedEntities?: Array<Entity> }}
     */
    computeOptimalDirectionAndRotationVariantAtTile({ root, tile, rotation, variant, layer }) {
        const searchDirection = enumAngleToDirection[rotation];
        const searchVector = enumDirectionToVector[searchDirection];
        const tier = enumUndergroundPipeVariantToTier[variant];

        const targetRotation = (rotation + 180) % 360;
        const targetSenderRotation = rotation;

        for (
            let searchOffset = 1;
            searchOffset <= globalConfig.undergroundPipeMaxTilesByTier[tier];
            ++searchOffset
        ) {
            tile = tile.addScalars(searchVector.x, searchVector.y);

            const contents = root.map.getTileContent(tile, "regular");
            if (contents) {
                const undergroundComp = contents.components.UndergroundPipe;
                if (undergroundComp && undergroundComp.tier === tier) {
                    const staticComp = contents.components.StaticMapEntity;
                    if (staticComp.rotation === targetRotation) {
                        if (undergroundComp.mode !== enumUndergroundPipeMode.sender) {
                            // If we encounter an underground receiver on our way which is also faced in our direction, we don't accept that
                            break;
                        }
                        return {
                            rotation: targetRotation,
                            rotationVariant: 1,
                            connectedEntities: [contents],
                        };
                    } else if (staticComp.rotation === targetSenderRotation) {
                        // Draw connections to receivers
                        if (undergroundComp.mode === enumUndergroundPipeMode.receiver) {
                            return {
                                rotation: rotation,
                                rotationVariant: 0,
                                connectedEntities: [contents],
                            };
                        } else {
                            break;
                        }
                    }
                }
            }
        }

        return {
            rotation,
            rotationVariant: 0,
        };
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    updateVariants(entity, rotationVariant, variant) {
        entity.components.UndergroundPipe.tier = enumUndergroundPipeVariantToTier[variant];

        switch (arrayUndergroundRotationVariantToMode[rotationVariant]) {
            case enumUndergroundPipeMode.sender: {
                entity.components.UndergroundPipe.mode = enumUndergroundPipeMode.sender;
                entity.components.FluidEjector.setSlots([]);
                entity.components.FluidAcceptor.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: [enumDirection.bottom],
                    },
                ]);
                return;
            }
            case enumUndergroundPipeMode.receiver: {
                entity.components.UndergroundPipe.mode = enumUndergroundPipeMode.receiver;
                entity.components.FluidAcceptor.setSlots([]);
                entity.components.FluidEjector.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                    },
                ]);
                return;
            }
            default:
                assertAlways(false, "Invalid rotation variant");
        }
    }
}
