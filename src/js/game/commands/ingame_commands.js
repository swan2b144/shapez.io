import { gMetaBuildingRegistry } from "../../core/global_registries";
import { Vector } from "../../core/vector";
import { defaultBuildingVariant } from "../meta_building";

export const say = function (text) {
    console.log(text);
};

export const placeBuilding = function (
    root,
    { x = 0, y = 0, building, variant = defaultBuildingVariant, rotation = 0, rotationVariant = 0 }
) {
    const placeable = root.logic.tryPlaceBuilding({
        origin: new Vector(x, y),
        rotation,
        rotationVariant,
        originalRotation: 0,
        building: gMetaBuildingRegistry.findById(building),
        variant,
    });

    // console.log(placeable);

    // if (placeable) {
    //     // Build
    //     const entity = gMetaBuildingRegistry.findById(building).createEntity({
    //         root,
    //         origin: new Vector(x, y),
    //         rotation,
    //         originalRotation: 0,
    //         rotationVariant,
    //         variant,
    //     });

    //     root.map.placeStaticEntity(entity);
    //     root.entityMgr.registerEntity(entity);
    // }
};
