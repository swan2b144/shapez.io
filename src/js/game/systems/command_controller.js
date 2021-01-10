import { globalConfig } from "../../core/config";
import { gMetaBuildingRegistry } from "../../core/global_registries";
import { DialogWithForm } from "../../core/modal_dialog_elements";
import { FormCommandInput, FormElementInput } from "../../core/modal_dialog_forms";
import { fillInLinkIntoTranslation } from "../../core/utils";
import { Vector } from "../../core/vector";
import { T } from "../../translations";
import { placeBuilding } from "../commands/ingame_commands";
import { CommandControllerComponent } from "../components/command_controller";
import { Entity } from "../entity";
import { GameSystemWithFilter } from "../game_system_with_filter";
import { BOOL_TRUE_SINGLETON } from "../items/boolean_item";
import { defaultBuildingVariant } from "../meta_building";

export class CommandControllerSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [CommandControllerComponent]);

        this.root.signals.entityManuallyPlaced.add(entity => this.editCommandController(entity));
    }

    update() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            const controllerComp = entity.components.CommandController;
            const command = controllerComp.command;
            const wirePins = entity.components.WiredPins;
            let status = false;
            for (let j = 0; j < wirePins.slots.length; ++j) {
                const slot = wirePins.slots[j];
                const network = slot.linkedNetwork;
                if (network) {
                    const item = network.currentValue;
                    if (item === BOOL_TRUE_SINGLETON) {
                        status = true;
                    }
                }
            }

            if (status) {
                try {
                    this.getFunction(command)(this);
                } catch (error) {
                    if (error instanceof Error) {
                        console.log(error);
                        return false;
                    }
                }

                this.getFunction(command)(this);
            }
        }
    }

    /**
     * @param {string} val
     */
    getFunction(val) {
        try {
            new Function("{ root, setTile }", val);
        } catch (error) {
            console.log(error);
            if (error instanceof Error) {
                return null;
            }
        }

        return new Function("{ root, setTile }", val);
    }

    setTile(
        root,
        { x = 0, y = 0, building, variant = defaultBuildingVariant, rotation = 0, rotationVariant = 0 }
    ) {
        root.logic.tryPlaceBuilding({
            origin: new Vector(x, y),
            rotation,
            rotationVariant,
            originalRotation: 0,
            building: gMetaBuildingRegistry.findById(building),
            variant,
        });
    }

    /**
     * Asks the entity to enter a valid signal code
     * @param {Entity} entity
     */
    editCommandController(entity, oldCommand = "") {
        if (!entity.components.CommandController) {
            return;
        }

        // Ok, query, but also save the uid because it could get stale
        const uid = entity.uid;

        const signalValueInput = new FormCommandInput({
            id: "signalValue",
            label: "",
            placeholder: "",
            defaultValue: oldCommand,
        });

        const dialog = new DialogWithForm({
            app: this.root.app,
            title: T.dialogs.editSignal.title,
            desc: T.dialogs.editSignal.descItems,
            formElements: [signalValueInput],
            closeButton: false,
        });

        this.root.hud.parts.dialogs.internalShowDialog(dialog);

        // When confirmed, set the signal
        const closeHandler = () => {
            if (!this.root || !this.root.entityMgr) {
                // Game got stopped
                return;
            }

            const entityRef = this.root.entityMgr.findByUid(uid, false);
            if (!entityRef) {
                // outdated
                return;
            }

            const controllerComp = this.root.entityMgr.findByUid(uid, false).components.CommandController;

            controllerComp.command = signalValueInput.getValue();
        };

        dialog.buttonSignals.ok.add(closeHandler);
        dialog.valueChosen.add(closeHandler);
    }
}
