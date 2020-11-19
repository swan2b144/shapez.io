import { Component } from "../component";

export class AutoBalancerComponent extends Component {
    static getId() {
        return "AutoBalancer";
    }

    static getSchema() {
        return null;
    }

    constructor() {
        super();
        this.balancerEjectorArray = [];
    }
}
