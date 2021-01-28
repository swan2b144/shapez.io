import { MetaBeltBuilding } from "../../buildings/belt";
import { MetaPipeBuilding } from "../../buildings/pipe";
import { MetaCutterBuilding } from "../../buildings/cutter";
import { MetaDisplayBuilding } from "../../buildings/display";
import { MetaFilterBuilding } from "../../buildings/filter";
import { MetaLeverBuilding } from "../../buildings/lever";
import { MetaMinerBuilding } from "../../buildings/miner";
import { MetaPumpBuilding } from "../../buildings/pump";
import { MetaMixerBuilding } from "../../buildings/mixer";
import { MetaPainterBuilding } from "../../buildings/painter";
import { MetaReaderBuilding } from "../../buildings/reader";
import { MetaRotaterBuilding } from "../../buildings/rotater";
import { MetaBalancerBuilding } from "../../buildings/balancer";
import { MetaStackerBuilding } from "../../buildings/stacker";
import { MetaTrashBuilding } from "../../buildings/trash";
import { MetaUndergroundBeltBuilding } from "../../buildings/underground_belt";
import { MetaUndergroundPipeBuilding } from "../../buildings/underground_pipe";
import { HUDBaseToolbar } from "./base_toolbar";
import { MetaStorageBuilding } from "../../buildings/storage";
import { MetaItemProducerBuilding } from "../../buildings/item_producer";
import { queryParamOptions } from "../../../core/query_parameters";

export class HUDBuildingsToolbar extends HUDBaseToolbar {
    constructor(root) {
        super(root, {
            primaryBuildings: [
                MetaBeltBuilding,
                MetaPipeBuilding,
                MetaBalancerBuilding,
                MetaUndergroundBeltBuilding,
                MetaUndergroundPipeBuilding,
                MetaMinerBuilding,
                MetaPumpBuilding,
                MetaCutterBuilding,
                MetaRotaterBuilding,
                MetaStackerBuilding,
                MetaMixerBuilding,
                MetaPainterBuilding,
                MetaTrashBuilding,
                ...(queryParamOptions.sandboxMode || G_IS_DEV ? [MetaItemProducerBuilding] : []),
            ],
            secondaryBuildings: [
                MetaStorageBuilding,
                MetaReaderBuilding,
                MetaLeverBuilding,
                MetaFilterBuilding,
                MetaDisplayBuilding,
            ],
            visibilityCondition: () =>
                !this.root.camera.getIsMapOverlayActive() && this.root.currentLayer === "regular",
            htmlElementId: "ingame_HUD_BuildingsToolbar",
        });
    }
}
