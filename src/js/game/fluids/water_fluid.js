import { globalConfig } from "../../core/config";
import { DrawParameters } from "../../core/draw_parameters";
import { types } from "../../savegame/serialization";
import { BaseFluid } from "../base_fluid";
import { Loader } from "../../core/loader";

export class WaterFluid extends BaseFluid {
    static getId() {
        return "water";
    }

    static getSchema() {
        return types.string;
    }

    constructor(definition) {
        super();

        /**
         * This property must not be modified on runtime, you have to clone the class in order to change the definition
         */
        this.definition = definition;
    }

    drawFullSizeOnCanvas(context, size) {
        if (!this.cachedSprite) {
            this.cachedSprite = Loader.getSprite("sprites/fluids/water.png");
        }
    }

    drawFluidCenteredClipped(x, y, parameters, diameter = globalConfig.defaultItemDiameter) {
        const realDiameter = diameter * 0.6;
        if (!this.cachedSprite) {
            this.cachedSprite = Loader.getSprite("sprites/fluids/water.png");
        }
        this.cachedSprite.drawCachedCentered(parameters, x, y, realDiameter);
    }
}
