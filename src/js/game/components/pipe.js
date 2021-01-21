import { Component } from "../component";

/** @enum {string} */
export const enumPipeType = {
    forward: "forward",
    turn: "turn",
    split: "split",
    cross: "cross",
};

export class PipeComponent extends Component {
    static getId() {
        return "Pipe";
    }

    /**
     * @param {object} param0
     * @param {enumPipeType=} param0.type
     */
    constructor({ type = enumPipeType.forward }) {
        super();
        this.type = type;

        this.linkedNetwork = null;
    }
}
