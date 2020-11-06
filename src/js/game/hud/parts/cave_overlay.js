import { makeOffscreenBuffer } from "../../../core/buffer_utils";
import { globalConfig } from "../../../core/config";
import { DrawParameters } from "../../../core/draw_parameters";
import { Loader } from "../../../core/loader";
import { lerp } from "../../../core/utils";
import { SOUNDS } from "../../../platform/sound";
import { KEYMAPPINGS } from "../../key_action_mapper";
import { enumHubGoalRewards } from "../../tutorial_goals";
import { BaseHUDPart } from "../base_hud_part";

export class HUDCaveOverlay extends BaseHUDPart {
    createElements(parent) {}

    initialize() {
        this.currentAlpha = 0.0;
    }

    update() {
        const desiredAlpha = this.root.currentLayer === "cave" ? 1.0 : 0.0;

        // On low performance, skip the fade
        if (this.root.entityMgr.entities.length > 5000 || this.root.dynamicTickrate.averageFps < 50) {
            this.currentAlpha = desiredAlpha;
        } else {
            this.currentAlpha = lerp(this.currentAlpha, desiredAlpha, 0.12);
        }
    }
}
