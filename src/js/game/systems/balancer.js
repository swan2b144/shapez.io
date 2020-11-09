import { globalConfig } from "../../core/config";
import { Loader } from "../../core/loader";
import { BaseItem } from "../base_item";
import { enumColors } from "../colors";
import { WirelessDisplayComponent } from "../components/wireless_display";
import { GameSystemWithFilter } from "../game_system_with_filter";
import { isTrueItem } from "../items/boolean_item";
import { ColorItem, COLOR_ITEM_SINGLETONS } from "../items/color_item";
import { MapChunkView } from "../map_chunk_view";
import { THIRDPARTY_URLS } from "../../core/config";
import { DialogWithForm } from "../../core/modal_dialog_elements";
import { FormElementInput, FormElementItemChooser } from "../../core/modal_dialog_forms";
import { fillInLinkIntoTranslation } from "../../core/utils";
import { T } from "../../translations";
import { Entity } from "../entity";
import { ProgrammableBalancerComponent } from "../components/balancer";
import { THEME} from "../theme";
import { enumDirection, Vector, enumDirectionToVector } from "../../core/vector";
import { ItemAcceptorComponent } from "../components/item_acceptor";
import { ItemEjectorComponent } from "../components/item_ejector";
import { isEntityName } from "typescript";

export class ProgrammableBalancerSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [ProgrammableBalancerComponent]);

        this.root.signals.postLoadHook.add(this.fixAllComponents, this);
        this.root.signals.entityManuallyPlaced.add(this.channelSignalValue, this);
    }

    update() {
        for (const entity in this.allEntities) {
            if (this.allEntities[entity].components.ItemAcceptor.slots.length == 0) {
                this.fixComponents(this.allEntities[entity]);
            }
        }
    }

    fixAllComponents() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            this.fixComponents(this.allEntities[i]);
        }
    }

    /**
     * Tests word for balancer
     * @param { string } word 
     */
    testSignal(word) {
        // If word isn't 4 letter it will return false
        if (word.length != 4) {
            return false;
        }

        if (word == "1111" || word == "0000") {
            return false;
        }

        this.sides = {
            top: word.slice(0,1),
            right: word.slice(1,2),
            bottom: word.slice(2,3),
            left: word.slice(3,4),
        };

        // Test for all sides and if there is a word diffrent than 0 or 1 return false
        for (const side in this.sides) {
            if (this.sides[side] != 0 && this.sides[side] != 1) {
                return false;
            }
        }

        this.word = word;

        // If it passes all tests return true
        return true;
    }

    /**
     * Sets components of entity
     * @param {*} entity 
     */
    fixComponents(entity) {
        if (entity.components.ProgrammableBalancer.word) {
            this.testSignal(entity.components.ProgrammableBalancer.word);
            const AcceptorSlots = [];
            const EjectorSlots = [];
            for (const side in this.sides) {
                if (this.sides[side] == 1) {
                    AcceptorSlots.push({
                        pos: new Vector(0, 0),
                        directions: [enumDirection[side]],
                    });
                } else if (this.sides[side] == 0) { 
                    EjectorSlots.push({
                        pos: new Vector(0, 0),
                        direction: enumDirection[side],
                    });
                }
            }
    
            if (entity.components.ItemAcceptor) {
                entity.components.ItemAcceptor.setSlots(AcceptorSlots);
            }
    
            if (entity.components.ItemEjector) {
                entity.components.ItemEjector.setSlots(EjectorSlots);
            }
        }
    }

    /**
     * Asks the entity to enter a valid signal code
     * @param {Entity} entity
     */
    channelSignalValue(entity) {
        if (entity.components.ProgrammableBalancer) {
            // Ok, query, but also save the uid because it could get stale
            const uid = entity.uid;

            const signalValueInput = new FormElementInput({
                id: "channelValue",
                label: fillInLinkIntoTranslation(T.dialogs.editBalancer.descShortKey, THIRDPARTY_URLS.shapeViewer),
                placeholder: "",
                defaultValue: "",
                validator: val => this.testSignal(val),
            });

            const dialog = new DialogWithForm({
                app: this.root.app,
                title: T.dialogs.editBalancer.title,
                desc: "",
                formElements: [signalValueInput],
                buttons: ["cancel:bad:escape", "ok:good:enter"],
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

                const constantComp = entityRef.components.ProgrammableBalancer;
                if (!constantComp) {
                    // no longer interesting
                    return;
                }

                if (signalValueInput.getValue()) {
                    this.fixComponents(entity);
                }

                entity.components.ProgrammableBalancer.word = this.word;
            };

            dialog.buttonSignals.ok.add(closeHandler);
            dialog.valueChosen.add(closeHandler);

            // When cancelled, destroy the entity again
            dialog.buttonSignals.cancel.add(() => {
                if (!this.root || !this.root.entityMgr) {
                    // Game got stopped
                    return;
                }

                const entityRef = this.root.entityMgr.findByUid(uid, false);
                if (!entityRef) {
                    // outdated
                    return;
                }

                const constantComp = entityRef.components.ProgrammableBalancer;
                if (!constantComp) {
                    // no longer interesting
                    return;
                }

                this.root.logic.tryDeleteBuilding(entityRef);
            });
        }
    }
}

