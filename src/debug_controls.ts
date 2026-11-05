import { TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, DEFAULT_PLAYER_MEMORY, DEFAULT_PLAYER_VIEW_DISTANCE, DEFAULT_PLAYER_SPEED } from "./constants.js";
import { getPlayerEntity } from "./entity.js";
import { generateMap, generateMapData } from "./map.js";
import type { Camera, EntityStorage, MapData } from "./models.js";
import { loadButton, loadMapFromLocalStorage, saveMapToLocalStorage, sleep, loadInput } from "./utils.js";

export function debugButtons(
  camera: Camera,
  entityStorage: EntityStorage,
  mapData: MapData,
  updateDebugVariable: () => void
) {
  const player = getPlayerEntity(entityStorage);

  loadButton("load-map-button").addEventListener("click", () => loadMapFromLocalStorage(entityStorage, mapData));

  loadButton("save-map-button").addEventListener("click", () => saveMapToLocalStorage(mapData));

  loadButton("generate-map-button").addEventListener("click", async () => {
    mapData = await generateMap(generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapData.mapSprite));

    await sleep(1);

    player.position.x = mapData.spawnPosition.x;
    player.position.y = mapData.spawnPosition.y;
    player.bodyPosition.x = player.position.x;
    player.bodyPosition.y = player.position.y;

    player.memoryDuration = DEFAULT_PLAYER_MEMORY;
    player.viewDistance = DEFAULT_PLAYER_VIEW_DISTANCE;
    player.speed = DEFAULT_PLAYER_SPEED;
    player.isAlive = true;

    entityStorage.clear();
  });

  loadButton("debug-button").addEventListener("click", updateDebugVariable);

  loadButton("freelook-button").addEventListener("click", () => {
    camera.freelook = !camera.freelook;
  });

  loadButton("set-player-speed-to-default-button").addEventListener("click", () => {
    player.speed = DEFAULT_PLAYER_SPEED;
    camera.speed = player.speed;
  });

  loadButton("set-player-view-distance-to-default-button").addEventListener("click", () => {
    player.viewDistance = DEFAULT_PLAYER_VIEW_DISTANCE;
  });

  loadButton("set-player-view-distance-button").addEventListener("click", () => {
    const value = loadInput("player-view-distance").valueAsNumber;

    if (Number.isNaN(value)) {
      console.error("View distance value error", value);
      return;
    }

    player.viewDistance = value;
  });

  loadButton("set-player-speed-button").addEventListener("click", () => {
    const value = loadInput("player-speed").valueAsNumber;

    if (Number.isNaN(value)) {
      console.error("Speed value error", value);
      return;
    }

    player.speed = value;
    camera.speed = player.speed;
  });
}
