import { Component } from "../component";
import { types } from "../../savegame/serialization";
import { BaseItem } from "../base_item";
import { typeItemSingleton } from "../item_resolver";

export class QuadSenderComponent extends Component {
    static getId() {
        return "QuadSender";
    }

    static getSchema() {
        return null;
    }

    constructor() {
        super();
    }
}