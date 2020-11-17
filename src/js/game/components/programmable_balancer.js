import { types } from "../../savegame/serialization";
import { Component } from "../component";

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
     * @param {string} word
     */
    constructor(word = "out/in/out/out") {
        super();
        this.word = word;
    }
}
