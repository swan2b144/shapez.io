import { globalConfig } from "../core/config";
import { DrawParameters } from "../core/draw_parameters";
import { BasicSerializableObject } from "../savegame/serialization";

export const fluidTypes =["water"];

export class BaseFluid extends BasicSerializableObject{

    constructor(){
        super();
    }

    static getId()
    {
        return "base_fluid";
    }

    static getSchema() {
        return {};
    }

    getItemType(){
        abstract;
        return "water";
    }

    getAsCopyableKey() {
        abstract;
        return "";
    }

}