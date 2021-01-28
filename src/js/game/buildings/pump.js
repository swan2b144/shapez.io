import { enumDirection, Vector } from "../../core/vector";
import { Entity } from "../entity";
import { MetaBuilding } from "../meta_building";
import { GameRoot } from "../root";
import { PumpComponent } from "../components/pump";
import { FluidEjectorComponent } from "../components/fluid_ejector";
import { enumPipeVariant } from "../components/pipe";
import { T } from "../../translations";
import { formatItemsPerSecond } from "../../core/utils";

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
     * @returns {Array<[string, string]>}
     */
    getPumpSpeed(root, variant) {
        const speed = root.hubGoals.getPipeBaseSpeed();
        return [[T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(speed)]];
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(new PumpComponent());
        entity.addComponent(
            new FluidEjectorComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                    },
                ],
            })
        );
    }
}
