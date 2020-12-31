import { enumDirection, enumInvertedDirections, Vector } from "../../core/vector";
import { types } from "../../savegame/serialization";
//TODO: Probably an import for a class that's an ialternative to BaseItem, since fluids aren't items on belts
import { Component } from "../component";

export class FluidAcceptorComponent extends Component{

    static getId() {
        return "FluidAcceptor";
    }

    constructor({ slots = [] }) {
        super();




        this.setSlots(slots);
    }

    setSlots(slots) {

        this.slots = [];
        for (let i = 0; i < slots.length; ++i) {
            const slot = slots[i];
            this.slots.push({
                pos: slot.pos,
                directions: slot.directions,

                // Which type of item to accept (shape | color | all) @see ItemType
                filter: slot.filter,
            });
        }
    }


}
