import { moveCamera } from "./camera.js";
import { DEFAULT_PLAYER_MEMORY, DEFAULT_PLAYER_SPEED, DEFAULT_PLAYER_VIEW_DISTANCE, MAP_TILES_HEIGHT, MAP_TILES_WIDTH, messages, TILE_SIZE } from "./constants.js";
import { setupKeyEvents } from "./controls.js";
import { applyLight, doMiniMap, drawMap, generateMap, generateMapData, getLineOfSightPath, updateMapFog, updateMapFogBasedOnObject, updateMapWithoutFog } from "./map.js";
import { type MapData, type Camera, type DirectionKeyboardInput, type SpriteSheet, type MapSprite, CompassEnum, type KeyboardInput, KeyboardInputTypeEnum, type Vector2, type RGE_Canvas, type EntityStorage, EntityEnum, type AmbientLighting, type WorldTime, type CreatureEntity, type FireplaceEntity, type TorchEntity, type PlayerEntity, type MapTimeColorPallete } from "./models.js";
import { addEntityBasedOnMousePosition, drawEntitiesFromNpcStorage, drawEntitiesFromObjectStorage, drawEntityOnPosition, getEntityStorageKey, moveEntity } from "./entity.js";
import { clearCanvas, drawGrid, loadButton, loadCanvas, loadImage, loadInput, loadMapFromLocalStorage, rand, saveMapToLocalStorage } from "./utils.js";
import { initPlayer } from "./player.js";

type GameLoopProps = {
  player: PlayerEntity,
  camera: Camera,
  directionalInputs: DirectionKeyboardInput[],
  controlInputs: KeyboardInput[],
  mapData: MapData,
  miniMapData: MapData,
  enemies: EntityStorage<CreatureEntity>,
  objectStorage: EntityStorage<FireplaceEntity>,
  playerObjectsStorage: EntityStorage<TorchEntity>,
  worldTime: WorldTime,
  ambientLighting: AmbientLighting,
  rgeCanvas: RGE_Canvas,
  miniMap: RGE_Canvas,
};

let DEBUG = true;
let PAUSED = false;
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
    context.imageSmoothingEnabled = false;
  });

  context.imageSmoothingEnabled = false;

  const worldTime: WorldTime = {
    time: 0,
    dayLength: 30,
  };

  const ambientLighting: AmbientLighting = {
    value: 1,
    modifier: true
  };

  const directionalInputs: DirectionKeyboardInput[] = [];
  const controlInputs: KeyboardInput[] = [];

  const gameSprites: SpriteSheet = {
    asset: loadImage("game-sprites"),
    tileSize: 32,
  };

  const player: PlayerEntity = {
    id: 0,
    type: EntityEnum.PLAYER,
    color: "WHITE",
    position: { x: 0, y: 0, },
    spawnTimestamp: Date.now(),
    sprite: {
      spriteSheet: gameSprites,
      current: 0,
      positions: [{ x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 }]
    },
    health: {
      isAlive: true,
      value: 1,
    },
    eyes: {
      viewDistance: DEFAULT_PLAYER_VIEW_DISTANCE,
      direction: { x: 0, y: -1 },
      memory: {
        canRemember: false,
        duration: 5000,
        endTimestamp: 0,
      }
    },
    movment: {
      body: { x: 0, y: 0, },
      direction: { x: 0, y: 0, },
      speed: DEFAULT_PLAYER_SPEED,
    },
  };

  const enemies: EntityStorage<CreatureEntity> = {};

  const objects: EntityStorage<FireplaceEntity> = {};

  const playerObjectsStorage: EntityStorage<TorchEntity> = {};


  const camera: Camera = {
    position: { x: 0, y: 0 },
    direction: { x: 0, y: 0 },
    speed: DEFAULT_PLAYER_SPEED,
    freelook: false,
  };

  const mapSprite: MapSprite = {
    spriteSheet: gameSprites,
    tileTypeSpriteCount: 4,
    startGroundPosition: { x: 1, y: 4 },
    startWallPosition: { x: 5, y: 4 },
  };

  const dayTimeColorPallette: MapTimeColorPallete[] = [
    { time: 0, color: { r: 0, g: 0, b: 0 } },
    { time: 0.40, color: { r: 0, g: 0, b: 0 } },
    //{ time: 0.5, r: 218, g: 120, b: 85 },
    { time: 0.5, color: { r: 210, g: 100, b: 61 } },
    { time: 0.6, color: { r: 210, g: 100, b: 61 } },
    //{ time: 0.7, r: 245, g: 183, b: 128 },
    { time: 0.7, color: { r: 119, g: 189, b: 233 } },
    { time: 0.75, color: { r: 81, g: 170, b: 231, } },
    { time: 0.8, color: { r: 23, g: 45, b: 80 } },
    { time: 1, color: { r: 0, g: 0, b: 0 } },
  ];

  const caveColorPallette: MapTimeColorPallete[] = [
    { time: 0, color: { r: 0, g: 0, b: 0 } },
    { time: 1, color: { r: 0, g: 0, b: 0 } },
  ];

  miniMap.canvas.width = 200;
  const mapData = await generateMap(generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapSprite, ambientLighting, dayTimeColorPallette));
  // const mapData = generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapSprite);
  // loadMapFromLocalStorage(player, enemies, mapData);
  const miniMapData: MapData = { ...mapData, tileSize: miniMap.canvas.width / MAP_TILES_WIDTH };

  // TODO: Should do this when update map
  miniMap.canvas.height = miniMapData.tileSize * MAP_TILES_HEIGHT;

  loadButton("load-map-button").addEventListener("click", () => loadMapFromLocalStorage(player, enemies, mapData));

  loadButton("save-map-button").addEventListener("click", () => saveMapToLocalStorage(mapData));

  loadButton("generate-map-button").addEventListener("click", async () => {
    const newMap = await generateMap(generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapSprite, mapData.ambientLighting, mapData.timeColorPallete));

    mapData.map = newMap.map;
    miniMapData.map = newMap.map;

    player.position.x = mapData.spawnPosition.x;
    player.position.y = mapData.spawnPosition.y;
    player.movment.body.x = player.position.x;
    player.movment.body.y = player.position.y;

    player.eyes.memory.duration = DEFAULT_PLAYER_MEMORY;
    player.eyes.viewDistance = DEFAULT_PLAYER_VIEW_DISTANCE;
    player.movment.speed = DEFAULT_PLAYER_SPEED;
    player.health.isAlive = true;

    Object.values(enemies).forEach(enemies => enemies.splice(0, enemies.length));
  });

  loadButton("debug-button").addEventListener("click", () => {
    DEBUG = !DEBUG;
  });

  loadButton("freelook-button").addEventListener("click", () => {
    camera.freelook = !camera.freelook;
  });

  loadButton("set-player-speed-to-default-button").addEventListener("click", () => {
    player.movment.speed = DEFAULT_PLAYER_SPEED;
    camera.speed = player.movment.speed;
  });

  loadButton("set-player-view-distance-to-default-button").addEventListener("click", () => {
    player.eyes.viewDistance = DEFAULT_PLAYER_VIEW_DISTANCE;
  });

  loadButton("set-player-view-distance-button").addEventListener("click", () => {
    const value = loadInput("player-view-distance").valueAsNumber;

    if (Number.isNaN(value)) {
      console.error("View distance value error", value);
      return;
    }

    player.eyes.viewDistance = value;
  });

  loadButton("set-player-speed-button").addEventListener("click", () => {
    const value = loadInput("player-speed").valueAsNumber;

    if (Number.isNaN(value)) {
      console.error("Speed value error", value);
      return;
    }

    player.movment.speed = value;
    camera.speed = player.movment.speed;
  });

  let currentSprite = 0;
  loadButton("change-map-sprite").addEventListener("click", async () => {
    currentSprite = (currentSprite + 1) % 2;

    if (currentSprite === 1) {
      const mapSprite: MapSprite = {
        spriteSheet: gameSprites,
        tileTypeSpriteCount: 4,
        startGroundPosition: { x: 1, y: 0 },
        startWallPosition: { x: 5, y: 0 },
      };
      const m = generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapSprite, ambientLighting, caveColorPallette);
      mapData.tilesData = m.tilesData;
      mapData.timeColorPallete = m.timeColorPallete;
      ambientLighting.modifier = false;
      ambientLighting.value = 1;
    }
    else {
      const mapSprite: MapSprite = {
        spriteSheet: gameSprites,
        tileTypeSpriteCount: 4,
        startGroundPosition: { x: 1, y: 4 },
        startWallPosition: { x: 5, y: 4 },
      };
      const m = generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapSprite, ambientLighting, dayTimeColorPallette);
      mapData.tilesData = m.tilesData;
      ambientLighting.modifier = true;
    }
  });

  canvas.addEventListener("click", (event) => {
    event.preventDefault();
    if (loadInput("enemy").checked) {
      const enemy: CreatureEntity = {
        id: 1,
        type: EntityEnum.CREATURE,
        color: "RED",
        position: { x: 0, y: 0 },
        spawnTimestamp: Date.now(),
        sprite: {
          spriteSheet: gameSprites,
          current: 2,
          positions: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }]
        },
        health: {
          isAlive: true,
          value: 1,
        },
        eyes: {
          viewDistance: DEFAULT_PLAYER_VIEW_DISTANCE,
          direction: { x: 0, y: 1 },
          memory: {
            canRemember: false,
            duration: DEFAULT_PLAYER_MEMORY,
            endTimestamp: 0,
          },
        },
        movment: {
          direction: { x: 0, y: 0, },
          body: { x: 0, y: 0 },
          speed: DEFAULT_PLAYER_SPEED,
        },
        path: {
          positions: [],
          memory: {
            canRemember: false,
            duration: 5000,
            endTimestamp: 0,
          },
        },
        message: null,
      };

      addEntityBasedOnMousePosition(camera, mapData, enemies, enemy, event, 1, gameSprites);
    } else {
      const fireplace: FireplaceEntity = {
        id: 2,
        type: EntityEnum.STATIC_OBJEECT,
        color: "ORANGE",
        position: { x: 0, y: 0 },
        spawnTimestamp: Date.now(),
        sprite: {
          spriteSheet: gameSprites,
          current: 0,
          positions: [{ x: 0, y: 2 }, { x: 1, y: 2 }]
        },
        light: {
          distance: DEFAULT_PLAYER_VIEW_DISTANCE,
          memory: {
            canRemember: true,
            duration: 1000 * 60,
            endTimestamp: Date.now() + 1000 * 60,
          }
        }
      };

      addEntityBasedOnMousePosition(camera, mapData, objects, fireplace, event, 1, gameSprites);
    }
  });

  let hasTorch = false;
  window.addEventListener("keydown", (event) => {
    if (event.key === ' ') {
      PAUSED = !PAUSED;
    }
    else if (event.key === 'f') {
      if (!hasTorch) {
        playerObjectsStorage[0] = [{
          id: 3,
          type: EntityEnum.OBJECT,
          position: player.movment.body,
          color: "RED",
          spawnTimestamp: Date.now(),
          sprite: {
            spriteSheet: gameSprites,
            current: 0,
            positions: [{ x: 0, y: 3 }, { x: 1, y: 3 }]
          },
          light: {
            distance: 3,
            memory: {
              canRemember: true,
              duration: 5000,
              endTimestamp: Date.now() + 5000,
            }
          }
        }];
        hasTorch = true;
      } else {
        hasTorch = false;
        playerObjectsStorage[0] = [];
      }
    }
  });

  const gameLoopProps: GameLoopProps = {
    player,
    camera,
    directionalInputs,
    controlInputs,
    mapData,
    miniMapData,
    enemies,
    objectStorage: objects,
    playerObjectsStorage,
    worldTime,
    ambientLighting,
    rgeCanvas,
    miniMap,
  };

  initPlayer(player, mapData);
  setupKeyEvents(directionalInputs, controlInputs);
  requestAnimationFrame(gameLoop(gameLoopProps));
};

let lastTime = 0;
function gameLoop(props: GameLoopProps) {
  const { canvas, context } = props.rgeCanvas;

  return function(time: number) {
    requestAnimationFrame(gameLoop(props));

    if (PAUSED) {
      return;
    }

    const {
      player,
      camera,
      directionalInputs,
      controlInputs,
      mapData,
      enemies,
      objectStorage,
      playerObjectsStorage,
      worldTime,
      ambientLighting,
      rgeCanvas,
      miniMap,
      miniMapData
    } = props;

    const dt = (time - lastTime) / 1000;
    lastTime = time;

    worldTime.time = time / 1000;

    const normalizedTimestamp = (worldTime.time % worldTime.dayLength) / worldTime.dayLength;

    if (ambientLighting.modifier && player.health.isAlive) {
      const offset = (3 / 24) * Math.PI * 2;
      ambientLighting.value = (1 + Math.cos(normalizedTimestamp * Math.PI * 2 - offset)) / 2;
    }

    if (DEBUG) {
      ambientLighting.value = Math.min(0.6, ambientLighting.value);
    }

    const enemyAbovePlayer = enemies[getEntityStorageKey(player.position)]?.[0];
    if (enemyAbovePlayer
      && enemyAbovePlayer.movment.body.x === player.position.x
      && enemyAbovePlayer.movment.body.y === player.position.y) {
      player.health.isAlive = false;
    }

    if (player.health.isAlive && !camera.freelook) {
      moveEntity(player, mapData, directionalInputs, controlInputs, dt);
    }

    if (player.health.isAlive) {
      moveCamera(player, camera, mapData, directionalInputs, canvas, dt);
      moveEnemiesUsingManhattanAlgo(player, mapData, enemies, dt);
    }

    if (DEBUG) {
      updateMapWithoutFog(mapData, camera, canvas);
    } else {
      updateMapFog(player, camera, mapData, canvas);
    }

    doObjects(player, objectStorage, mapData);
    doObjects(player, playerObjectsStorage, mapData);

    context.beginPath();

    clearCanvas("#000", rgeCanvas);
    drawMap(camera, mapData, rgeCanvas);
    drawEntitiesFromObjectStorage(camera, mapData, player, objectStorage, context, DEBUG);
    drawEntitiesFromNpcStorage(camera, mapData, player, enemies, context, DEBUG);
    drawEntityOnPosition(camera, player.movment.body, player, mapData.tileSize, context, DEBUG);
    drawEntitiesFromObjectStorage(camera, mapData, player, playerObjectsStorage, context, DEBUG);
    applyLight(camera, mapData, ambientLighting, worldTime, rgeCanvas);
    doMiniMap(player, miniMapData, miniMap);


    if (!player.health.isAlive) {
      const message = "You are dead";
      const measureMessage = context.measureText(message);
      context.font = "60px bold sans-serif";
      context.fillStyle = "RED";
      context.fillText(
        message,
        canvas.width / 2 - measureMessage.width / 2,
        canvas.height / 2,
      );
      player.eyes.viewDistance = 0;
      player.eyes.memory.duration = 0;
    }

    const totalMinutes = normalizedTimestamp * 60 * 24;
    const hours = Math.floor(totalMinutes / 60).toFixed(0).padStart(2, '0');
    const minutes = Math.floor(totalMinutes % 60).toFixed(0).padStart(2, '0');
    const totalDays = Math.floor(worldTime.time / worldTime.dayLength);
    const day = ((totalDays % 30) + 1).toFixed(0).padStart(2, '0');
    const month = Math.floor(((totalDays / 30) % 12) + 1).toFixed(0).padStart(2, '0');
    const year = Math.floor(totalDays / (30 * 12)).toFixed(0).padStart(2, '0');;
    const dateTime = `${day}/${month}/${year} ${hours}:${minutes}h`;

    context.font = "30px bold sans-serif";
    context.fillStyle = "WHITE";
    context.fillText(
      dateTime,
      50,
      50,
    );

    if (DEBUG) {
      drawGrid(TILE_SIZE, camera, rgeCanvas, "#FFFFFF18");
    }

    context.closePath();
  }
}

function doObjects(player: PlayerEntity, objectsStorage: EntityStorage<FireplaceEntity | TorchEntity>, mapData: MapData) {
  Object.values(objectsStorage).forEach(objects => {
    const object = objects[0];

    if (!object) {
      return;
    }

    const distanceFromPlayer =
      Math.abs(object.position.x - player.position.x) + Math.abs(object.position.y - player.position.y);

    if (distanceFromPlayer > 60) {
      return;
    }

    if (object.light.memory.canRemember) {
      updateMapFogBasedOnObject(player, object, mapData);

      if (Date.now() > object.light.memory.endTimestamp) {
        object.light.memory.canRemember = false;
        object.sprite.current = 1;
      }
    }
  });
}

function moveEnemiesUsingManhattanAlgo(
  player: PlayerEntity,
  mapData: MapData,
  enemiesStorage: EntityStorage<CreatureEntity>,
  deltaTime: number
): void {
  Object.values(enemiesStorage).forEach(enemies => {
    const enemy = enemies.splice(0, 1)[0];

    if (!enemy) {
      return;
    }

    const distanceFromPlayer =
      Math.abs(enemy.position.x - player.position.x) + Math.abs(enemy.position.y - player.position.y);

    if (distanceFromPlayer > DEFAULT_PLAYER_VIEW_DISTANCE * 3) {
      const newKey = getEntityStorageKey({
        x: enemy.position.x + enemy.movment.direction.x,
        y: enemy.position.y + enemy.movment.direction.y
      });

      if (enemiesStorage[newKey] === undefined) {
        enemiesStorage[newKey] = [enemy];
      } else {
        enemiesStorage[newKey].unshift(enemy);
      }
      return;
    }

    const control: DirectionKeyboardInput[] = [];
    const shouldMove = enemy.movment.direction.x === 0 && enemy.movment.direction.y === 0;

    if (shouldMove) {
      let newPathToFollow: Vector2[] = [];

      const enemyToPlayerVector: Vector2 = {
        x: player.position.x - enemy.position.x,
        y: player.position.y - enemy.position.y
      };

      const isPlayerAheadEnemy =
        enemy.movment.direction.x * enemyToPlayerVector.x + enemy.movment.direction.y * enemyToPlayerVector.y >= 0;

      if (enemy.path.memory.canRemember || isPlayerAheadEnemy) {
        newPathToFollow = getLineOfSightPath(mapData, enemy.position, player.position);
      }

      const hasLineOfSightToPlayer = newPathToFollow.length > 0;

      if (Date.now() > enemy.path.memory.endTimestamp) {
        enemy.path.positions = [];
        enemy.path.memory.canRemember = false;
      }

      if (hasLineOfSightToPlayer) {
        enemy.path.positions = newPathToFollow;
        enemy.path.memory.endTimestamp = Date.now() + enemy.path.memory.duration;
        enemy.color = "GREEN";
      }
      else {
        enemy.color = enemy.path.memory.canRemember ? "BLUE" : "RED";
      }

      if (enemy.path.positions.length > 0) {
        const nextPosition = enemy.path.positions.splice(0, 1)[0];

        if (nextPosition !== undefined) {
          const direction: Vector2 = {
            x: nextPosition.x - enemy.position.x,
            y: nextPosition.y - enemy.position.y,
          };

          if (!hasLineOfSightToPlayer) {
            enemy.color = "PURPLE";
          }

          const newKey = getEntityStorageKey({
            x: enemy.position.x + direction.x,
            y: enemy.position.y + direction.y
          });

          if (enemiesStorage[newKey] === undefined || enemiesStorage[newKey].length === 0) {
            control.push({
              id: 'rand',
              direction,
              type: KeyboardInputTypeEnum.DIRECTIONAL
            });
          } else {
            enemy.path.positions.unshift(nextPosition);
          }
        }
      }
      else if (rand(0, 10000) < 5) {
        // const direction: Vector2 = computeRandomDirection();
        // const newKey = getEntityStorageKey({
        //   x: enemy.position.x + direction.x,
        //   y: enemy.position.y + direction.y
        // });
        //
        // if (enemiesStorage[newKey] === undefined || enemiesStorage[newKey].length === 0) {
        //   control.push({
        //     id: 'rand',
        //     direction,
        //     type: KeyboardInputTypeEnum.DIRECTIONAL
        //   });
        // }
      }
    }

    moveEntity(enemy, mapData, control, [], deltaTime);

    const newKey = getEntityStorageKey({
      x: enemy.position.x + enemy.movment.direction.x,
      y: enemy.position.y + enemy.movment.direction.y
    });

    if (enemiesStorage[newKey] === undefined) {
      enemiesStorage[newKey] = [enemy];
    } else {
      enemiesStorage[newKey].unshift(enemy);
    }

    if (enemy.message !== null && Date.now() > enemy.message.memory.endTimestamp) {
      enemy.message = null;
    }
    else if (rand(0, 10000) < 15) {
      const text = messages[rand(0, messages.length - 1)];

      if (text) {
        enemy.message = {
          position: { x: enemy.position.x, y: enemy.position.y },
          text,
          memory: {
            canRemember: true,
            duration: 5000,
            endTimestamp: Date.now() + 5000
          },
        }
      }
    }
  });
}

const compass: CompassEnum[] = [CompassEnum.EAST, CompassEnum.SOUTH, CompassEnum.NORTH, CompassEnum.WEST];
function computeRandomDirection(): Vector2 {
  const compassDirection = compass[rand(0, compass.length)] ?? CompassEnum.NORTH;

  switch (compassDirection) {
    case (CompassEnum.NORTH):
      return { x: 0, y: -1 };
    case (CompassEnum.EAST):
      return { x: 1, y: 0 };
    case (CompassEnum.SOUTH):
      return { x: 0, y: 1 };
    default:
      return { x: -1, y: 0 };
  };
}
