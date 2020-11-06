import { MetaBeltBuilding } from "../../buildings/belt";
import { MetaCutterBuilding } from "../../buildings/cutter";
import { MetaDisplayBuilding } from "../../buildings/display";
import { MetaWirelessDisplayBuilding } from "../../buildings/wireless_display";
import { MetaFilterBuilding } from "../../buildings/filter";
import { MetaLeverBuilding } from "../../buildings/lever";
import { MetaMinerBuilding } from "../../buildings/miner";
import { MetaMixerBuilding } from "../../buildings/mixer";
import { MetaPainterBuilding } from "../../buildings/painter";
import { MetaReaderBuilding } from "../../buildings/reader";
import { MetaRotaterBuilding } from "../../buildings/rotater";
import { MetaBalancerBuilding } from "../../buildings/balancer";
import { MetaStackerBuilding } from "../../buildings/stacker";
import { MetaTrashBuilding } from "../../buildings/trash";
import { MetaUndergroundBeltBuilding } from "../../buildings/underground_belt";
import { HUDBaseToolbar } from "./base_toolbar";
import { MetaStorageBuilding } from "../../buildings/storage";
import { MetaItemProducerBuilding } from "../../buildings/item_producer";
import { MetaHubBuilding } from "../../buildings/hub";

export class HUDBuildingsToolbar extends HUDBaseToolbar {
    constructor(root) {
        const survivalMod = root.app.settings.getAllSettings().survivalMod;
        const sandboxMod = root.app.settings.getAllSettings().sandboxMod;
        const wirelessDisplayMod = root.app.settings.getAllSettings().wirelessDisplayMod;
        super(root, {
            primaryBuildings: [
                MetaBeltBuilding,
                MetaBalancerBuilding,
                MetaUndergroundBeltBuilding,
                MetaMinerBuilding,
                MetaCutterBuilding,
                MetaRotaterBuilding,
                MetaStackerBuilding,
                MetaMixerBuilding,
                MetaPainterBuilding,
                MetaTrashBuilding,
                ...(survivalMod || sandboxMod ? [MetaHubBuilding] : []),
                ...(sandboxMod ? [MetaItemProducerBuilding] : []),
            ],
            secondaryBuildings: [
                MetaStorageBuilding,
                MetaReaderBuilding,
                MetaLeverBuilding,
                MetaFilterBuilding,
                MetaDisplayBuilding,
                ...(wirelessDisplayMod ? [MetaWirelessDisplayBuilding] : []),
            ],
            visibilityCondition: () =>
                !this.root.camera.getIsMapOverlayActive() && this.root.currentLayer === "regular",
            htmlElementId: "ingame_HUD_BuildingsToolbar",
        });
    }
}
