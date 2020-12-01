import { globalConfig } from "../../core/config";
import { Loader } from "../../core/loader";
import { GameSystemWithFilter } from "../game_system_with_filter";
import { MapChunkView } from "../map_chunk_view";
import { enumDirectionToAngle, Vector } from "../../core/vector";
import { drawRotatedSprite } from "../../core/draw_utils";
import { DynamicRemoteSignalComponent } from "../components/dynamic_remote_signal";

/** @type {Object<ItemType, number>} */
const enumTypeToSize = {
    boolean: 9,
    shape: 9,
    color: 14,
};

export class DynamicRemoteSignalSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [DynamicRemoteSignalComponent]);
    }

    update() {
        // Reset All List
        this.wirelessSignalList = {};
        for (let i = 0; i < this.allEntities.length; i++) {
            const entity = this.allEntities[i];
            const outputSlot = entity.components.WiredPins.slots[0];
            const adressSlot = entity.components.WiredPins.slots[2];
            const adressNetwork = adressSlot.linkedNetwork;

            // Define Lists Again

            if (adressNetwork) {
                const value  = adressNetwork.currentValue;
                if (value) {
                    if (!this.wirelessSignalList[value.getAsCopyableKey()]) {
                        this.wirelessSignalList[value.getAsCopyableKey()] = [];
                    }

                    this.wirelessSignalList[value.getAsCopyableKey()].push(entity);
                }
            }

            if (!adressNetwork) {
                outputSlot.value = null;
            }
        }

        for (const code in this.wirelessSignalList) {
            const Entities = this.wirelessSignalList[code];

            for (let i = 0; i < Entities.length; ++i) {
                const entity = Entities[i];

                const pinsComp = entity.components.WiredPins;
                const input_network = pinsComp.slots[1].linkedNetwork;
                const receiverEntities = this.wirelessSignalList[code];

                if (!receiverEntities) {
                    continue;
                }
    
                for (let j = 0; j < receiverEntities.length; ++j) {
                    const receiverEntity = receiverEntities[j];

                    if (receiverEntity === entity) {
                        continue;
                    }

                    // Set Outputs
    
                    const receiverOutput = receiverEntity.components.WiredPins.slots[0];
                    if (input_network) {
                        receiverOutput.value = input_network.currentValue;
                    } else {
                        receiverOutput.value = null;
                    }
                }
            }
        }

        for (const code in this.wirelessSignalList) {
            const Entities = this.wirelessSignalList[code];
            let nullInputs = 0;

            if (!Entities) {
                continue;
            }

            for (let i = 0; i < Entities.length; ++i) {
                const entity = Entities[i];
                const pinsComp = entity.components.WiredPins;
                const input_network = pinsComp.slots[1].linkedNetwork;

                if (!input_network) {
                    nullInputs++;
                    continue;
                }
            }
            
            if (nullInputs === Entities.length || Entities.length === 1) {
                for (let i = 0; i < Entities.length; ++i) {
                    const entity = Entities[i];
                    const output = entity.components.WiredPins.slots[0];
                    output.value = null;
                }
            } else if (nullInputs < Entities.length - 2) {
                for (let i = 0; i < Entities.length; ++i) {
                    const entity = Entities[i];
                    const output = entity.components.WiredPins.slots[0];
                    output.value = null;
                }
            }
        }
    }
}