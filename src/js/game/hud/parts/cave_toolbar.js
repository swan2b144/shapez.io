import { HUDBaseToolbar } from "./base_toolbar";
import { MetaHubBuilding } from "../../buildings/hub";

export class HUDCaveToolbar extends HUDBaseToolbar {
    constructor(root) {
        const wirelessDisplayMod = root.app.settings.getAllSettings().wirelessDisplayMod;
        super(root, {
            primaryBuildings: [
                MetaHubBuilding,
            ],
            secondaryBuildings: [],
            visibilityCondition: () =>
                !this.root.camera.getIsMapOverlayActive() && this.root.currentLayer === "cave",
            htmlElementId: "ingame_HUD_wires_toolbar",
            layer: "cave",
        });
    }
}
