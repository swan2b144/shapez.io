import { enumDirection, Vector } from "../../core/vector";
import { enumPinSlotType, WiredPinsComponent } from "../components/wired_pins";
import { Entity } from "../entity";
import { defaultBuildingVariant, MetaBuilding } from "../meta_building";
import { GameRoot } from "../root";
import { WirelessDisplayComponent } from "../components/wireless_display";
import { enumHubGoalRewards } from "../tutorial_goals";
import { formatItemsPerSecond, generateMatrixRotations } from "../../core/utils";
import { QuadSenderComponent } from "../components/quad_sender";


/** @enum {string} */
export const enumWirelessDisplayVariants = {
    remote_control: "remote_control",
    quad_sender: "quad_sender",
};

export class MetaWirelessDisplayBuilding extends MetaBuilding {
    constructor() {
        super("wireless_display");
    }

    getSilhouetteColor() {
        return "#aaaaaa";
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_display);
    }

    getAvailableVariants() {
        return [defaultBuildingVariant, enumWirelessDisplayVariants.remote_control, enumWirelessDisplayVariants.quad_sender];
    }

    getDimensions() {
        return new Vector(1, 1);
    }

    getShowWiresLayerPreview() {
        return true;
    }

    setupEntityComponents(entity) {
        entity.addComponent(new WirelessDisplayComponent());
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
                break;
            case enumWirelessDisplayVariants.remote_control:
                if (!entity.components.WiredPins) {
                    entity.addComponent(new WiredPinsComponent({ slots: [] }));
                }
                entity.components.WiredPins.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ]);
                break;
            case enumWirelessDisplayVariants.quad_sender:
                if (!entity.components.WiredPins) {
                    entity.addComponent(new WiredPinsComponent({ slots: [] }));
                }
                entity.components.WiredPins.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.right,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.left,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ]);
                if (!entity.components.QuadSender) {
                    entity.addComponent(new QuadSenderComponent());
                }
                break;
            default:
                break;
        }
    }
}
