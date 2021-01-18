import { globalConfig } from "../core/config";
import { DrawParameters } from "../core/draw_parameters";
import { BasicSerializableObject } from "../savegame/serialization";
import { THEME } from "../game/theme";

export const enumFluids = {
    water: "water",
};

export class BaseFluid extends BasicSerializableObject {
    /**
     * @param {enumFluids} fluid
     */
    constructor(fluid) {
        super();
        this.fluid = fluid;
    }

    static getId() {
        return "base_fluid";
    }

    static getSchema() {
        return {};
    }

    static getItemType() {
        abstract;
        return "water";
    }

    getViscosity() {
        abstract;
        return 1.0;
    }

    drawFullSizeOnCanvas(context, size) {
        abstract;
    }

    drawItemCenteredClipped(x, y, parameters, diameter = globalConfig.defaultItemDiameter) {
        if (parameters.visibleRect.containsCircle(x, y, diameter / 2)) {
            this.drawItemCenteredImpl(x, y, parameters, diameter);
        }
    }

    drawItemCenteredImpl(x, y, parameters, diameter = globalConfig.defaultItemDiameter) {
        abstract;
    }

    getBackgroundColorAsResource() {
        return THEME.map.resources.fluids;
    }
}

export const FLUID_SINGLETONS = {};

for (const fluid in enumFluids) {
    FLUID_SINGLETONS[fluid] = new BaseFluid(enumFluids[fluid]);
}
