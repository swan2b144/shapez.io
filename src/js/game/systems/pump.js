import { globalConfig } from "../../core/config";
import { DrawParameters } from "../../core/draw_parameters";
import { enumDirectionToVector } from "../../core/vector";
import { BaseItem } from "../base_item";
import { MetaPumpBuilding } from "../buildings/pump";
import { MinerComponent } from "../components/miner";
import { PumpComponent } from "../components/pump";
import { Entity } from "../entity";
import { GameSystemWithFilter } from "../game_system_with_filter";
import { enumFluids, FLUID_ITEM_SINGLETONS } from "../items/fluid_item";
import { MapChunkView } from "../map_chunk_view";

export class PumpSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [PumpComponent]);

        this.needsRecompute = true;
        this.root.signals.entityAdded.add(this.updateEntity, this);
    }

    update() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            const pumpComp = entity.components.Pump;
            if (!pumpComp) {
                continue;
            }

            const staticComp = entity.components.StaticMapEntity;
            const pos = staticComp.origin;

            // const nextEntities = this.root.logic.findSurroundingPipeTargets(pos, );

            // const newTargets = this.root.logic.findSurroundingPipeTargets(
            //     newSearchTile,
            //     newSearchDirections,
            //     currentNetwork
            // );
        }
    }

    updateEntity(entity) {
        if (!entity.components.FluidPins) {
            return;
        }

        const pins = entity.components.FluidPins;
        for (let j = 0; j < pins.slots.length; ++j) {
            const slot = pins.slots[j];
            slot.value = FLUID_ITEM_SINGLETONS[enumFluids.water];
        }
    }
}
