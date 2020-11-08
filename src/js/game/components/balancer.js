import { types } from "../../savegame/serialization";
import { Component } from "../component";
import { BaseItem } from "../base_item";
import { typeItemSingleton } from "../item_resolver";

export class ProgrammableBalancerComponent extends Component {
    static getId() {
        return "ProgrammableBalancer";
    }

    static getSchema() {
        return {
            word: types.string,
        };
    }

    /**
     * @param {String=} sides
     */
    constructor(word = null) {
        super();
        this.word = word;
    }
}
