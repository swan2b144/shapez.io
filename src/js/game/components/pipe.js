import { enumDirection, Vector } from "../../core/vector";
import { Component } from "../component";

/** @enum {string} */
export const enumPipeType = {
    forward: "forward",
    turn: "turn",
};

/** @enum {string} */
export const enumPipeVariant = {
    pipe: "pipe",
    industrial: "industrial",
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
     * @param {enumPipeVariant=} param0.variant
     */
    constructor({ type = enumPipeType.forward, variant = enumPipeVariant.pipe }) {
        super();
        this.type = type;
        this.direction = enumDirection.top;

        /**
         * The variant of the wire, different variants do not connect
         * @type {enumPipeVariant}
         */
        this.variant = variant;

        /**
         * @type {import("../systems/pipe").PipeNetwork}
         */
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
