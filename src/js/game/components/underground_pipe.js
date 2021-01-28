import { globalConfig } from "../../core/config";
import { types } from "../../savegame/serialization";
import { BaseItem } from "../base_item";
import { Component } from "../component";
import { Entity } from "../entity";
import { typeItemSingleton } from "../item_resolver";

/** @enum {string} */
export const enumUndergroundPipeMode = {
    sender: "sender",
    receiver: "receiver",
};

/**
 * @typedef {{
 *   entity: Entity,
 *   distance: number
 * }} LinkedUndergroundPipe
 */

export class UndergroundPipeComponent extends Component {
    static getId() {
        return "UndergroundPipe";
    }

    static getSchema() {
        return {
            pendingfluids: types.array(types.pair(typeItemSingleton, types.float)),
        };
    }

    /**
     *
     * @param {object} param0
     * @param {enumUndergroundPipeMode=} param0.mode As which type of belt the entity acts
     * @param {number=} param0.tier
     */
    constructor({ mode = enumUndergroundPipeMode.sender, tier = 0 }) {
        super();

        this.mode = mode;
        this.tier = tier;

        /** @type {Array<{ item: BaseItem, progress: number }>} */
        this.consumptionAnimations = [];

        /**
         * Used on both receiver and sender.
         * Reciever: Used to store the next item to transfer, and to block input while doing this
         * Sender: Used to store which items are currently "travelling"
         * @type {Array<[BaseItem, number]>} Format is [Item, ingame time to eject the item]
         */
        this.pendingfluids = [];

        /**
         * The linked entity, used to speed up performance. This contains either
         * the entrance or exit depending on the tunnel type
         * @type {LinkedUndergroundPipe}
         */
        this.cachedLinkedEntity = null;
    }

    /**
     * Tries to accept an item from an external source like a regular belt or building
     * @param {BaseItem} fluid
     * @param {number} pipeSpeed How fast this item travels
     */
    tryAcceptExternalItem(fluid, pipeSpeed) {
        if (this.mode !== enumUndergroundPipeMode.sender) {
            // Only senders accept external items
            return false;
        }

        if (this.pendingfluids.length > 0) {
            // We currently have a pending item
            return false;
        }

        this.pendingfluids.push([fluid, 0]);
        return true;
    }

    /**
     * Tries to accept a tunneled item
     * @param {BaseItem} fluid
     * @param {number} travelDistance How many tiles this item has to travel
     * @param {number} pipeSpeed How fast this item travels
     * @param {number} now Current ingame time
     */
    tryAcceptTunneledItem(fluid, travelDistance, pipeSpeed, now) {
        if (this.mode !== enumUndergroundPipeMode.receiver) {
            // Only receivers can accept tunneled items
            return false;
        }

        // Notice: We assume that for all items the travel distance is the same
        const maxItemsInTunnel = (2 + travelDistance) / globalConfig.itemSpacingOnPipes;
        if (this.pendingfluids.length >= maxItemsInTunnel) {
            // Simulate a real belt which gets full at some point
            return false;
        }

        // NOTICE:
        // This corresponds to the item ejector - it needs 0.5 additional tiles to eject the item.
        // So instead of adding 1 we add 0.5 only.
        // Additionally it takes 1 tile for the acceptor which we just add on top.
        const travelDuration = (travelDistance + 1.5) / pipeSpeed / globalConfig.itemSpacingOnPipes;

        this.pendingfluids.push([fluid, now + travelDuration]);
        return true;
    }
}
