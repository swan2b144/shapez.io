import { Loader } from "../../core/loader";
import { formatItemsPerSecond, generateMatrixRotations } from "../../core/utils";
import { enumAngleToDirection, enumDirection, Vector } from "../../core/vector";
import { SOUNDS } from "../../platform/sound";
import { T } from "../../translations";
import { enumPipeType, PipeComponent, enumPipeVariant } from "../components/pipe";
import { Entity } from "../entity";
import { defaultBuildingVariant, MetaBuilding } from "../meta_building";
import { GameRoot } from "../root";
import { THEME } from "../theme";

export const arrayPipeRotationVariantToType = [enumPipeType.forward, enumPipeType.turn];
export const arrayPipeVariantToRotation = [enumDirection.top, enumDirection.right];


export const pipeOverlayMatrices = {
    [enumPipeType.forward]: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),
    [enumPipeType.turn]: generateMatrixRotations([0, 0, 0, 0, 1, 1, 0, 1, 0]),

};

/** @enum {string} */
export const pipeVariants = {
    industrial: "industrial",
};

const enumPipeVariantToVariant = {
    [defaultBuildingVariant]: enumPipeVariant.pipe,
    [pipeVariants.industrial]: enumPipeVariant.industrial,

};

export class MetaPipeBuilding extends MetaBuilding {
    constructor() {
        super("pipe");
    }

    getHasDirectionLockAvailable() {
        return true;
    }

    getSilhouetteColor() {
        return "#61ef6f";
    }

    /**
     *
     *@param {string} variant
     */
    isPlaceableToFluid(variant) {
        switch (variant) {
            case defaultBuildingVariant:
                return true;
            case enumPipeVariant.industrial:
                return false;
        }
    }

    getStayInPlacementMode() {
        return true;
    }

    getPlacementSound() {
        return SOUNDS.placeBelt;
    }

    getRotateAutomaticallyWhilePlacing() {
        return false;
    }

    getSprite() {
        return null;
    }

    getIsReplaceable() {
        return true;
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return true;
    }

    getAvailableVariants(root) {
        let variants = [defaultBuildingVariant, enumPipeVariant.industrial];
        variants.push(enumPipeVariant.industrial);
        return variants;
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(new PipeComponent({}));
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    updateVariants(entity, rotationVariant, variant) {
        entity.components.Pipe.type = arrayPipeRotationVariantToType[rotationVariant];
        entity.components.Pipe.variant = enumPipeVariantToVariant[variant];
        entity.components.Pipe.direction = arrayPipeVariantToRotation[rotationVariant];
        console.log(entity.components.StaticMapEntity.rotation);

    }

    /**
     *
     * @param {number} rotation
     * @param {number} rotationVariant
     * @param {string} variant
     * @param {Entity} entity
     */
    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant, entity) {
        return pipeOverlayMatrices[entity.components.Pipe.type][rotation];
    }

    /**
     *
     * @param {number} rotationVariant
     * @param {string} variant
     * @returns {import("../../core/draw_utils").AtlasSprite}
     */
    getPreviewSprite(rotationVariant, variant) {
        const pipeVariant = enumPipeVariantToVariant[variant];
        switch (arrayPipeRotationVariantToType[rotationVariant]) {
            case enumPipeType.forward: {
                return Loader.getSprite("sprites/pipes/" + pipeVariant + "_forward.png");
            }
            case enumPipeType.turn: {
                return Loader.getSprite("sprites/pipes/" + pipeVariant + "_turn.png");


            }
        }
    }

    getBlueprintSprite(rotationVariant, variant) {
        return this.getPreviewSprite(rotationVariant, variant);
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

        const pipeVariant = enumPipeVariantToVariant[variant];

        const connections = {
            top: root.logic.computePipeEdgeStatus({ tile, pipeVariant, edge: enumDirection.top }),
            right: root.logic.computePipeEdgeStatus({ tile, pipeVariant, edge: enumDirection.right }),
            bottom: root.logic.computePipeEdgeStatus({ tile, pipeVariant, edge: enumDirection.bottom }),
            left: root.logic.computePipeEdgeStatus({ tile, pipeVariant, edge: enumDirection.left }),
        };

        let flag = 0;
        flag |= connections.top ? 0x1000 : 0;
        flag |= connections.right ? 0x100 : 0;
        flag |= connections.bottom ? 0x10 : 0;
        flag |= connections.left ? 0x1 : 0;

        let targetType = enumPipeType.forward;

        // First, reset rotation
        rotation = 0;

        switch (flag) {
            case 0x0000:
                // Nothing
                break;

            case 0x0001:
                // Left
                rotation += 90;
                break;

            case 0x0010:
                // Bottom
                // END
                break;

            case 0x0011:
                // Bottom | Left
                targetType = enumPipeType.turn;
                rotation += 90;
                break;

            case 0x0100:
                // Right
                rotation += 90;
                break;

            case 0x0101:
                // Right | Left
                rotation += 90;
                break;

            case 0x0110:
                // Right | Bottom
                targetType = enumPipeType.turn;
                break;

            case 0x1000:
                // Top
                break;

            case 0x1001:
                // Top | Left
                targetType = enumPipeType.turn;
                rotation += 180;
                break;

            case 0x1010:
                // Top | Bottom
                break;

            case 0x1100:
                // Top | Right
                targetType = enumPipeType.turn;
                rotation -= 90;
                break;

        const topDirection = enumAngleToDirection[rotation];
        const rightDirection = enumAngleToDirection[(rotation + 90) % 360];
        const bottomDirection = enumAngleToDirection[(rotation + 180) % 360];
        const leftDirection = enumAngleToDirection[(rotation + 270) % 360];

        const { ejectors, acceptors } = root.logic.getEjectorsAndAcceptorsAtTileForPipes(tile);

        let hasBottomEjector = false;
        let hasRightEjector = false;
        let hasLeftEjector = false;

        let hasTopAcceptor = false;
        let hasLeftAcceptor = false;
        let hasRightAcceptor = false;

        // Check all ejectors
        for (let i = 0; i < ejectors.length; ++i) {
            const ejector = ejectors[i];

            if (ejector.toDirection === topDirection) {
                hasBottomEjector = true;
            } else if (ejector.toDirection === leftDirection) {
                hasRightEjector = true;
            } else if (ejector.toDirection === rightDirection) {
                hasLeftEjector = true;
            }
        }

        // Check all acceptors
        for (let i = 0; i < acceptors.length; ++i) {
            const acceptor = acceptors[i];
            if (acceptor.fromDirection === bottomDirection) {
                hasTopAcceptor = true;
            } else if (acceptor.fromDirection === rightDirection) {
                hasLeftAcceptor = true;
            } else if (acceptor.fromDirection === leftDirection) {
                hasRightAcceptor = true;
            }
        }

        // Soo .. if there is any ejector below us we always prioritize
        // this ejector
        if (!hasBottomEjector) {
            // When something ejects to us from the left and nothing from the right,
            // do a curve from the left to the top

            if (hasRightEjector && !hasLeftEjector) {
                return {
                    rotation: (rotation + 270) % 360,
                    rotationVariant: 1,
                };
            }

            // When something ejects to us from the right and nothing from the left,
            // do a curve from the right to the top
            if (hasLeftEjector && !hasRightEjector) {
                return {
                    rotation: (rotation + 180) % 360,
                    rotationVariant: 1,
                };
            }
        }

        // When there is a top acceptor, ignore sides
        // NOTICE: This makes the belt prefer side turns *way* too much!
        if (!hasTopAcceptor) {
            // When there is an acceptor to the right but no acceptor to the left,
            // do a turn to the right
            if (hasRightAcceptor && !hasLeftAcceptor) {
                return {
                    rotation,
                    rotationVariant: 1,
                };
            }

            // When there is an acceptor to the left but no acceptor to the right,
            // do a turn to the left
            if (hasLeftAcceptor && !hasRightAcceptor) {
                return {
                    rotation: (rotation + 90) % 360,
                    rotationVariant: 1,
                };
            }
        }

        return {
            rotation,
            rotationVariant: 0,
        };
    }
}
