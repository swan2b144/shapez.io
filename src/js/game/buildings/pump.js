import { enumDirection, Vector } from "../../core/vector";
import { Entity } from "../entity";
import { MetaBuilding } from "../meta_building";
import { GameRoot } from "../root";
import { PumpComponent } from "../components/pump";

export class MetaPumpBuilding extends MetaBuilding {
    constructor() {
        super("pump");
    }

    getSilhouetteColor() {
        return "#000000"; //"#b37dcd";
    }

    isPlaceableToFluids() {
        return true;
    }

    isPlaceableToGround() {
        return false;
    }

    /**
     * @param {GameRoot} root
     * @param {string} variant
     * @returns {number}
     */
    getPumpSpeed(root, variant) {
        return 5; //globalConfig.pumpSpeedLPerSecond * HubGoals.upgradeImprovements.fluids;
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(new PumpComponent());
        //     entity.addComponent(
        //         new FluidPinsComponent({
        //             slots: [
        //                 {
        //                     pos: new Vector(0, 0),
        //                     direction: enumDirection.top,
        //                     type: enumPinSlotType.fluidEjector,
        //                 },
        //                 {
        //                     pos: new Vector(0, 0),
        //                     direction: enumDirection.right,
        //                     type: enumPinSlotType.fluidEjector,
        //                 },
        //                 {
        //                     pos: new Vector(0, 0),
        //                     direction: enumDirection.bottom,
        //                     type: enumPinSlotType.fluidEjector,
        //                 },
        //                 {
        //                     pos: new Vector(0, 0),
        //                     direction: enumDirection.left,
        //                     type: enumPinSlotType.fluidEjector,
        //                 },
        //             ],
        //         })
        //     );
        // }
    }
}
