import { Component } from "../component";
import { types } from "../../savegame/serialization";
import { BaseItem } from "../base_item";
import { typeItemSingleton } from "../item_resolver";

export class WirelessCodeComponent extends Component {
    static getId() {
        return "WirelessCode";
    }

    static getSchema() {
        return {
            wireless_code: types.string,
        };
    }

    /**
     *
     * @param {string} wireless_code 
     */
    constructor(wireless_code = "") {
        super();
        this.wireless_code = wireless_code;
    }
}