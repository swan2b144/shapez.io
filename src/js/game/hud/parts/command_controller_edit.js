import { STOP_PROPAGATION } from "../../../core/signal";
import { makeDiv } from "../../../core/utils";
import { Vector } from "../../../core/vector";
import { enumMouseButton } from "../../camera";
import { BaseHUDPart } from "../base_hud_part";

export class HUDCommandControllerEdit extends BaseHUDPart {
    initialize() {
        this.root.camera.downPreHandler.add(this.downPreHandler, this);
    }

    /**
     * @param {Vector} pos
     * @param {enumMouseButton} button
     */
    downPreHandler(pos, button) {
        const tile = this.root.camera.screenToWorld(pos).toTileSpace();
        const contents = this.root.map.getLayersContentsMultipleXY(tile.x, tile.y);
        for (let i = 0; i < contents.length; ++i) {
            const content = contents[i];
            if (content) {
                const commandControllerComp = content.components.CommandController;
                if (commandControllerComp) {
                    if (button === enumMouseButton.left) {
                        const oldCommand = commandControllerComp.command;
                        this.root.systemMgr.systems.commandController.editCommandController(
                            content,
                            oldCommand
                        );
                        return STOP_PROPAGATION;
                    }
                }
            }
        }
    }
}
