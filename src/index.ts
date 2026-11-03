import { moveCamera } from "./camera.js";
import { DEFAULT_PLAYER_MEMORY, DEFAULT_PLAYER_SPEED, DEFAULT_PLAYER_VIEW_DISTANCE, MAP_TILES_HEIGHT, MAP_TILES_WIDTH, OUTBOUNDED_INDEX, TILE_SIZE } from "./constants.js";
import { setupKeyEvents } from "./controls.js";
import { doMiniMap, drawMap, generateMap, generateMapData, updateMapFog, updateMapWithoutFog, validateLineOfSight } from "./map.js";
import { type MapData, type Camera, type Entity, type DirectionKeyboardInput, type SpriteSheet, type MapSprite, CompassEnum, type KeyboardInput, normalizedDirection, KeyboardInputTypeEnum, type Vector2, TileTypeEnum, type NpcStorage, type NpcEntity, type RGE_Canvas } from "./models.js";
import { addEnemyBasedOnMousePosition, drawEntities, drawEntity, getNpcStorageKey, moveEntity } from "./entity.js";
import { clearCanvas, loadButton, loadCanvas, loadImage, loadInput, loadMapFromLocalStorage, rand, saveMapToLocalStorage, sleep } from "./utils.js";
import { initPlayer } from "./player.js";

let DEBUG = true;
window.addEventListener("load", main);

async function main() {
  const rgeCanvas = loadCanvas("game");
  const miniMap = loadCanvas("mini-map");
  const { canvas, context } = rgeCanvas;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  context.imageSmoothingEnabled = false;

  const directionalInputs: DirectionKeyboardInput[] = [];
  const controlInputs: KeyboardInput[] = [];

  const player: Entity = {
    id: 0,
    isAlive: true,
    viewDistance: DEFAULT_PLAYER_VIEW_DISTANCE,
    color: "WHITE",
    position: { x: 0, y: 0, },
    body: { x: 0, y: 0, },
    direction: { x: 0, y: 0, },
    speed: DEFAULT_PLAYER_SPEED,
    facing: CompassEnum.NORTH,
    memory: DEFAULT_PLAYER_MEMORY
  };

  const enemies: NpcStorage = {};

  const camera: Camera = {
    position: { x: 0, y: 0 },
    direction: { x: 0, y: 0 },
    speed: DEFAULT_PLAYER_SPEED,
    freelook: false,
  };

  const gameSprites: SpriteSheet = {
    sprites: loadImage("game-sprites"),
    tileSize: 32,
  };

  const mapSprite: MapSprite = {
    spriteSheet: gameSprites,
    tileTypeSpriteCount: 4,
    groundOffset: 1,
    wallOffset: 5
  };

  let mapData = await generateMap(generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapSprite));
  const miniMapData: MapData = { ...mapData, tileSize: miniMap.canvas.width / MAP_TILES_WIDTH };

  // TODO: Should do this when update map
  miniMap.canvas.width = 300;
  miniMap.canvas.height = miniMapData.tileSize * MAP_TILES_HEIGHT;

  loadButton("load-map-button").addEventListener("click", () => loadMapFromLocalStorage(player, enemies, mapData));

  loadButton("save-map-button").addEventListener("click", () => saveMapToLocalStorage(mapData));

  loadButton("generate-map-button").addEventListener("click", async () => {
    mapData = await generateMap(generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapSprite));

    await sleep(1);

    player.position.x = mapData.spawnPosition.x;
    player.position.y = mapData.spawnPosition.y;
    player.body.x = player.position.x;
    player.body.y = player.position.y;

    player.memory = DEFAULT_PLAYER_MEMORY;
    player.viewDistance = DEFAULT_PLAYER_VIEW_DISTANCE;
    player.speed = DEFAULT_PLAYER_SPEED;
    player.isAlive = true;

    Object.values(enemies).forEach(enemies => enemies.splice(0, enemies.length));
  });

  loadButton("debug-button").addEventListener("click", () => {
    DEBUG = !DEBUG;
  });

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

  canvas.addEventListener("click", addEnemyBasedOnMousePosition(
    camera,
    mapData,
    enemies,
    DEFAULT_PLAYER_SPEED * .8,
    gameSprites,
    1000,
    DEBUG
  ));

  initPlayer(player, mapData, gameSprites);
  setupKeyEvents(player, directionalInputs, controlInputs);
  requestAnimationFrame(
    gameLoop(
      player,
      camera,
      directionalInputs,
      controlInputs,
      mapData,
      miniMapData,
      enemies,
      rgeCanvas,
      miniMap,
      0
    )
  );
};

function gameLoop(
  player: Entity,
  camera: Camera,
  directionalInputs: DirectionKeyboardInput[],
  controlInputs: KeyboardInput[],
  mapData: MapData,
  miniMapData: MapData,
  enemies: NpcStorage,
  rgeCanvas: RGE_Canvas,
  miniMap: RGE_Canvas,
  lastTime: number
) {
  const { canvas, context } = rgeCanvas;
  return function(time: number) {
    const dt = (time - lastTime) / 1000;

    const enemyAbovePlayer = enemies[getNpcStorageKey(player.position)]?.[0];
    if (enemyAbovePlayer
      && enemyAbovePlayer.body.x === player.position.x
      && enemyAbovePlayer.body.y === player.position.y) {
      player.isAlive = false;
    }

    if (player.isAlive && !camera.freelook) {
      moveEntity(player, mapData, directionalInputs, controlInputs, dt);
    }
    if (player.isAlive) {
      moveCamera(player, camera, mapData, directionalInputs, canvas, dt);
      moveEnemiesUsingManhattanAlgo(player, mapData, enemies, dt);
    }

    if (DEBUG) {
      updateMapWithoutFog(mapData, camera, canvas);
    } else {
      updateMapFog(player, camera, mapData, canvas);
    }

    context.beginPath();

    clearCanvas("#000", rgeCanvas);
    drawMap(camera, mapData, rgeCanvas);
    drawEntities(camera, mapData, player, enemies, context, DEBUG);
    drawEntity(player, camera, mapData, context, DEBUG);
    doMiniMap(player, miniMapData, miniMap);


    if (DEBUG) {
      // context.font = "40px bold sans-serif";
      // context.fillStyle = "WHITE";
      // context.fillText(
      //   `(${player.position.x}, ${player.position.y})`,
      //   (player.position.x - camera.position.x) * mapData.tileSize,
      //   (player.position.y + 1 - camera.position.y) * mapData.tileSize,
      // );
    }

    if (!player.isAlive) {
      const message = "You are dead";
      const measureMessage = context.measureText(message);
      context.font = "60px bold sans-serif";
      context.fillStyle = "RED";
      context.fillText(
        message,
        canvas.width / 2 - measureMessage.width / 2,
        canvas.height / 2,
      );
      player.viewDistance = 0;
      player.memory = 0;
    }

    if (DEBUG) {
      //drawGrid(TILE_SIZE, camera, rgeCanvas, "#FFFFFFAA");
    }

    context.closePath();

    sleep(1).then(() => {
      requestAnimationFrame(
        gameLoop(
          player,
          camera,
          directionalInputs,
          controlInputs,
          mapData,
          miniMapData,
          enemies,
          rgeCanvas,
          miniMap,
          time
        )
      );
    });
  }
}

function moveEnemiesUsingManhattanAlgo(
  player: Entity,
  mapData: MapData,
  enemiesStorage: NpcStorage,
  deltaTime: number
): void {
  Object.values(enemiesStorage).forEach(enemies => {
    const enemy = enemies.splice(0, 1)[0];

    if (!enemy) {
      return;
    }

    const distanceFromPlayer =
      Math.abs(enemy.position.x - player.position.x) + Math.abs(enemy.position.y - player.position.y);

    if (distanceFromPlayer > 60) {
      return;
    }

    const control: DirectionKeyboardInput[] = [];
    const shouldMove = enemy.direction.x === 0 && enemy.direction.y === 0;

    if (shouldMove) {
      let direction: Vector2 = computeRandomDirection();

      const normalizedEnemyDirection = normalizedDirection[enemy.facing];
      const enemyToPlayerVector: Vector2 = {
        x: player.position.x - enemy.position.x,
        y: player.position.y - enemy.position.y
      };
      const dot =
        normalizedEnemyDirection.x * enemyToPlayerVector.x + normalizedEnemyDirection.y * enemyToPlayerVector.y;

      const los = dot >= 0 && validateLineOfSight(mapData, player.position, enemy.position);

      if (los) {
        enemy.isGoingTo = { x: player.position.x, y: player.position.y };
        enemy.memoryDate = Date.now();
        enemy.color = "GREEN";
      }

      if (Date.now() - (enemy?.memoryDate ?? 0) > enemy.memory) {
        enemy.memoryDate = undefined;
      }

      if (!los && enemy.memoryDate === undefined) {
        enemy.isGoingTo = undefined;
      }

      if (!los) {
        enemy.color = !enemy.memoryDate ? "RED" : "BLUE";
      }

      if (enemy.isGoingTo !== undefined) {
        direction = computeDirectionUsingManhattanAlgo(enemy, mapData) ?? direction;

        if (!los) {
          enemy.color = "PURPLE";
        }

        const newKey = getNpcStorageKey({
          x: enemy.position.x + direction.x,
          y: enemy.position.y + direction.y
        });

        if (enemiesStorage[newKey] === undefined || enemiesStorage[newKey].length === 0) {
          control.push({
            id: 'rand',
            direction,
            type: KeyboardInputTypeEnum.DIRECTIONAL
          });
        }
      } else {
        if (!enemy.memoryDate) {
          direction = { x: 0, y: 0 };

          if (rand(0, 10000) < 15) {
            enemy.memoryDate = Date.now() + (enemy.memory * .2);
          }
        } else {
          const newKey = getNpcStorageKey({
            x: enemy.position.x + direction.x,
            y: enemy.position.y + direction.y
          });

          if (enemiesStorage[newKey] === undefined || enemiesStorage[newKey].length === 0) {
            control.push({
              id: 'rand',
              direction,
              type: KeyboardInputTypeEnum.DIRECTIONAL
            });
          }
        }
      }
    }

    moveEntity(
      enemy,
      mapData,
      control,
      [],
      deltaTime
    );

    const newKey = getNpcStorageKey({
      x: enemy.position.x + enemy.direction.x,
      y: enemy.position.y + enemy.direction.y
    });

    if (enemiesStorage[newKey] === undefined) {
      enemiesStorage[newKey] = [enemy];
    } else {
      enemiesStorage[newKey].unshift(enemy);
    }
  });
}

export function computeDirectionUsingManhattanAlgo(
  enemy: NpcEntity,
  mapData: MapData
): Vector2 | undefined {
  if (enemy.isGoingTo === undefined) {
    return undefined;
  }

  let x = Math.sign(enemy.position.x - enemy.isGoingTo.x) * -1;
  let y = Math.sign(enemy.position.y - enemy.isGoingTo.y) * -1;

  if (Math.abs(x) === Math.abs(y)) {
    y = 0;
  }

  const mapTile = mapData.map?.[enemy.position.y + y]?.[enemy.position.x + x];
  const tileData = mapData.tilesData[mapTile?.tileMapDataId ?? OUTBOUNDED_INDEX];

  if (tileData?.type === TileTypeEnum.WALL) {
    if (rand(0, 10000) < 5000) {
      const mapTile = mapData.map?.[enemy.position.y + y]?.[enemy.position.x];
      const tileData = mapData.tilesData[mapTile?.tileMapDataId ?? OUTBOUNDED_INDEX];

      if (tileData?.type === TileTypeEnum.WALL) {
        y = 0;
      } else {
        x = 0;
      }
    } else {
      const mapTile = mapData.map?.[enemy.position.y]?.[enemy.position.x + x];
      const tileData = mapData.tilesData[mapTile?.tileMapDataId ?? OUTBOUNDED_INDEX];

      if (tileData?.type === TileTypeEnum.WALL) {
        x = 0;
      } else {
        y = 0;
      }
    }
  }

  if (x === 0 && y === 0) {
    if (rand(0, 10000) < 5000) x = rand(0, 10000) < 5000 ? 1 : -1;
    else y = rand(0, 10000) < 5000 ? 1 : -1;
  }

  return { x, y };
}

const compass: CompassEnum[] = [CompassEnum.EAST, CompassEnum.SOUTH, CompassEnum.NORTH, CompassEnum.WEST];
export function computeRandomDirection(): Vector2 {
  const directionIndex = compass[rand(0, Object.values(normalizedDirection).length)];
  return normalizedDirection[directionIndex ?? CompassEnum.NORTH];
}

export function moveEnemiesIntoRandomPosition(mapData: MapData, enemies: Entity[], deltaTime: number): void {
  enemies.forEach(enemy => {
    const shouldMove = enemy.direction.x === 0 && enemy.direction.y === 0;
    const direction = computeRandomDirection();
    const control: DirectionKeyboardInput[] = !shouldMove ? [] : [{
      id: 'rand',
      direction,
      type: KeyboardInputTypeEnum.DIRECTIONAL
    }];

    moveEntity(
      enemy,
      mapData,
      control,
      [],
      deltaTime
    );
  });
}
