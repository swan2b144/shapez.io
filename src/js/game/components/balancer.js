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
            signal: types.nullable(typeItemSingleton),
        };
    }

    /**
     * Copy the current state to another component
     * @param {ProgrammableBalancerComponent} otherComponent
     */
    copyAdditionalStateTo(otherComponent) {
        otherComponent.signal = this.signal;
    }

    /**
     *
     * @param {object} param0
     * @param {BaseItem=} param0.signal The signal to store
     */
    constructor({ signal = null }) {
        super();
        this.signal = signal;
    }
}
