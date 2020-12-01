import { Component } from "../component";

export class DynamicRemoteSignalComponent extends Component {
    static getId() {
        return "DynamicRemoteSignal";
    }

    static getSchema() {
        return null;
    }

    constructor() {
        super();
    }
}