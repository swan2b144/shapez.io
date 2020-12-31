import { DrawParameters } from "../../core/draw_parameters";
import { types } from "../../savegame/serialization";
import {BaseFluid} from "../base_fluid";
import {Loader} from "../../core/loader";

export class WaterFluid extends BaseFluid{

    static getId(){
        return "water";
    }

    static getSchema(){

        return types.string;

    }

    



}
