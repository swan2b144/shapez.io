import { globalConfig } from "../core/config";
import { DrawParameters } from "../core/draw_parameters";
import { BasicSerializableObject } from "../savegame/serialization";

export const fluidTypes = ["water"];

export class BaseFluid extends BasicSerializableObject {
    constructor() {
        super();
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
}
