import { enumDirection, Vector } from "../../core/vector";
import { Component } from "../component";

/** @enum {string} */
export const enumPipeType = {
    forward: "forward",
    turn: "turn",
};

export const FAKE_PIPE_ACCEPTOR_SLOT = {
    pos: new Vector(0, 0),
    direction: enumDirection.bottom,
};

export const FAKE_PIPE_EJECTOR_SLOT_BY_DIRECTION = {
    [enumDirection.top]: {
        pos: new Vector(0, 0),
        direction: enumDirection.top,
    },

    [enumDirection.right]: {
        pos: new Vector(0, 0),
        direction: enumDirection.right,
    },

    [enumDirection.left]: {
        pos: new Vector(0, 0),
        direction: enumDirection.left,
    },
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
        this.direction = enumDirection.top;

        this.linkedNetwork = null;
    }

    /**
     * Returns fake acceptor slot used for matching
     */
    getFakeAcceptorSlot() {
        return FAKE_PIPE_ACCEPTOR_SLOT;
    }

    /**
     * Returns fake acceptor slot used for matching
     */
    getFakeEjectorSlot() {
        return FAKE_PIPE_EJECTOR_SLOT_BY_DIRECTION[this.direction];
    }
}
