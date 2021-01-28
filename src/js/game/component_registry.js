import { gComponentRegistry } from "../core/global_registries";
import { StaticMapEntityComponent } from "./components/static_map_entity";
import { BeltComponent } from "./components/belt";
import { ItemEjectorComponent } from "./components/item_ejector";
import { ItemAcceptorComponent } from "./components/item_acceptor";
import { MinerComponent } from "./components/miner";
import { ItemProcessorComponent } from "./components/item_processor";
import { UndergroundBeltComponent } from "./components/underground_belt";
import { HubComponent } from "./components/hub";
import { StorageComponent } from "./components/storage";
import { WiredPinsComponent } from "./components/wired_pins";
import { BeltUnderlaysComponent } from "./components/belt_underlays";
import { WireComponent } from "./components/wire";
import { ConstantSignalComponent } from "./components/constant_signal";
import { LogicGateComponent } from "./components/logic_gate";
import { LeverComponent } from "./components/lever";
import { WireTunnelComponent } from "./components/wire_tunnel";
import { DisplayComponent } from "./components/display";
import { BeltReaderComponent } from "./components/belt_reader";
import { FilterComponent } from "./components/filter";
import { ItemProducerComponent } from "./components/item_producer";
import { PumpComponent } from "./components/pump";
import { PipeComponent } from "./components/pipe";
import { PipeTunnelComponent } from "./components/pipe_tunnel";
import { FluidAcceptorComponent } from "./components/fluid_acceptor";
import { FluidEjectorComponent } from "./components/fluid_ejector";
import { UndergroundPipeComponent } from "./components/underground_pipe";

export function initComponentRegistry() {
    gComponentRegistry.register(StaticMapEntityComponent);
    gComponentRegistry.register(BeltComponent);
    gComponentRegistry.register(ItemEjectorComponent);
    gComponentRegistry.register(ItemAcceptorComponent);
    gComponentRegistry.register(MinerComponent);
    gComponentRegistry.register(ItemProcessorComponent);
    gComponentRegistry.register(UndergroundBeltComponent);
    gComponentRegistry.register(HubComponent);
    gComponentRegistry.register(StorageComponent);
    gComponentRegistry.register(WiredPinsComponent);
    gComponentRegistry.register(BeltUnderlaysComponent);
    gComponentRegistry.register(WireComponent);
    gComponentRegistry.register(ConstantSignalComponent);
    gComponentRegistry.register(LogicGateComponent);
    gComponentRegistry.register(LeverComponent);
    gComponentRegistry.register(WireTunnelComponent);
    gComponentRegistry.register(DisplayComponent);
    gComponentRegistry.register(BeltReaderComponent);
    gComponentRegistry.register(FilterComponent);
    gComponentRegistry.register(ItemProducerComponent);

    // Water Mod
    gComponentRegistry.register(FluidAcceptorComponent);
    gComponentRegistry.register(FluidEjectorComponent);
    gComponentRegistry.register(PumpComponent);
    gComponentRegistry.register(PipeComponent);
    gComponentRegistry.register(PipeTunnelComponent);
    gComponentRegistry.register(UndergroundPipeComponent);

    // IMPORTANT ^^^^^ UPDATE ENTITY COMPONENT STORAGE AFTERWARDS

    // Sanity check - If this is thrown, you (=me, lol) forgot to add a new component here

    assert(
        // @ts-ignore
        require.context("./components", false, /.*\.js/i).keys().length ===
            gComponentRegistry.getNumEntries(),
        "Not all components are registered"
    );

    console.log("📦 There are", gComponentRegistry.getNumEntries(), "components");
}
