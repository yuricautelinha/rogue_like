import { moveCamera } from "./camera.js";
import { DEFAULT_PLAYER_MEMORY, DEFAULT_PLAYER_SPEED, DEFAULT_PLAYER_VIEW_DISTANCE, MAP_TILES_HEIGHT, MAP_TILES_WIDTH, messages, TILE_SIZE } from "./constants.js";
import { setupKeyEvents } from "./controls.js";
import { doMiniMap, drawMap, generateMap, generateMapData, getLineOfSightPath, updateMapFog, updateMapFogBasedOnObject, updateMapWithoutFog } from "./map.js";
import { type MapData, type Camera, type Entity, type DirectionKeyboardInput, type SpriteSheet, type MapSprite, CompassEnum, type KeyboardInput, normalizedDirection, KeyboardInputTypeEnum, type Vector2, type NpcStorage, type RGE_Canvas, type ObjectStorage, EntityEnum, type AmbientLighting, type WorldTime } from "./models.js";
import { addEnemyBasedOnMousePosition, addObjectBasedOnMousePosition, drawEntitiesFromNpcStorage, drawEntitiesFromObjectStorage, drawEntity, getEntityStorageKey, moveEntity } from "./entity.js";
import { clearCanvas, loadButton, loadCanvas, loadImage, loadInput, loadMapFromLocalStorage, rand, saveMapToLocalStorage } from "./utils.js";
import { initPlayer } from "./player.js";

type GameLoopProps = {
  player: Entity,
  camera: Camera,
  directionalInputs: DirectionKeyboardInput[],
  controlInputs: KeyboardInput[],
  mapData: MapData,
  miniMapData: MapData,
  enemies: NpcStorage,
  objectStorage: ObjectStorage,
  playerObjectsStorage: ObjectStorage,
  worldTime: WorldTime,
  ambientLighting: AmbientLighting,
  rgeCanvas: RGE_Canvas,
  miniMap: RGE_Canvas,
};

let DEBUG = false;
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
    dayLength: 60,
  };

  const ambientLighting: AmbientLighting = {
    value: 1,
    modifier: true
  };

  const directionalInputs: DirectionKeyboardInput[] = [];
  const controlInputs: KeyboardInput[] = [];

  const gameSprites: SpriteSheet = {
    sprites: loadImage("game-sprites"),
    tileSize: 32,
  };

  const player: Entity = {
    id: EntityEnum.PLAYER,
    isAlive: true,
    viewDistance: DEFAULT_PLAYER_VIEW_DISTANCE,
    color: "WHITE",
    position: { x: 0, y: 0, },
    body: { x: 0, y: 0, },
    direction: { x: 0, y: 0, },
    speed: DEFAULT_PLAYER_SPEED,
    facing: CompassEnum.NORTH,
    memory: 5000,
    spawnTimestamp: Date.now()
  };

  const enemies: NpcStorage = {};

  const objects: ObjectStorage = {};

  const playerObjectsStorage: ObjectStorage = {};


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

  miniMap.canvas.width = 200;
  const mapData = await generateMap(generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapSprite));
  // const mapData = generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapSprite);
  // loadMapFromLocalStorage(player, enemies, mapData);
  const miniMapData: MapData = { ...mapData, tileSize: miniMap.canvas.width / MAP_TILES_WIDTH };

  // TODO: Should do this when update map
  miniMap.canvas.height = miniMapData.tileSize * MAP_TILES_HEIGHT;

  loadButton("load-map-button").addEventListener("click", () => loadMapFromLocalStorage(player, enemies, mapData));

  loadButton("save-map-button").addEventListener("click", () => saveMapToLocalStorage(mapData));

  loadButton("generate-map-button").addEventListener("click", async () => {
    const newMap = await generateMap(generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapSprite));

    mapData.map = newMap.map;
    miniMapData.map = newMap.map;

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
      const m = generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapSprite);
      player.viewDistance = 0;
      mapData.tilesData = m.tilesData;
      ambientLighting.modifier = false;
    }
    else {
      const mapSprite: MapSprite = {
        spriteSheet: gameSprites,
        tileTypeSpriteCount: 4,
        startGroundPosition: { x: 1, y: 4 },
        startWallPosition: { x: 5, y: 4 },
      };
      const m = generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapSprite);
      player.viewDistance = DEFAULT_PLAYER_VIEW_DISTANCE;
      mapData.tilesData = m.tilesData;
      ambientLighting.modifier = true;
    }
  });

  canvas.addEventListener("click", (event) => {
    event.preventDefault();
    if (loadInput("enemy").checked) {
      addEnemyBasedOnMousePosition(
        camera,
        mapData,
        enemies,
        DEFAULT_PLAYER_SPEED,
        gameSprites,
        1,
        DEBUG
      )(event);
    } else {
      addObjectBasedOnMousePosition(
        camera,
        mapData,
        objects,
        gameSprites,
        DEBUG
      )(event);
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
          body: player.body,
          position: player.position,
          color: "",
          direction: { x: 0, y: 0 },
          facing: CompassEnum.NORTH,
          id: EntityEnum.TORCH,
          isAlive: true,
          memory: 1000 * 60,
          spawnTimestamp: Date.now(),
          speed: 0,
          viewDistance: 5,
          sprite: {
            spriteSheet: gameSprites,
            position: { x: 0, y: 3 }
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

  initPlayer(player, mapData, gameSprites);
  setupKeyEvents(player, directionalInputs, controlInputs);
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
      miniMapData,
      enemies,
      objectStorage,
      playerObjectsStorage,
      worldTime,
      ambientLighting,
      rgeCanvas,
      miniMap,
    } = props;

    const dt = (time - lastTime) / 1000;
    lastTime = time;

    worldTime.time = time / 1000;

    const normalizedTimestamp = (worldTime.time % worldTime.dayLength) / worldTime.dayLength;

    const offset = (4 / 24) * Math.PI * 2;
    ambientLighting.value = ((1 - Math.cos(normalizedTimestamp * Math.PI * 2 - offset)) / 2);
    if (ambientLighting.modifier && player.isAlive) {
      player.viewDistance = Math.floor(ambientLighting.value * (canvas.width / mapData.tileSize));
    } else {
      player.viewDistance = 0;
    }

    const enemyAbovePlayer = enemies[getEntityStorageKey(player.position)]?.[0];
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

    doObjects(player, objectStorage, mapData);
    doObjects(player, playerObjectsStorage, mapData);

    context.beginPath();

    clearCanvas("#000", rgeCanvas);
    drawMap(camera, mapData, rgeCanvas);
    drawEntitiesFromObjectStorage(camera, mapData, player, objectStorage, context, DEBUG);
    drawEntitiesFromNpcStorage(camera, mapData, player, enemies, context, DEBUG);
    drawEntity(player, camera, mapData, context, DEBUG);
    drawEntitiesFromObjectStorage(camera, mapData, player, playerObjectsStorage, context, DEBUG);
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

    const totalMinutes = normalizedTimestamp * 60 * 24;
    const hours = Math.floor(totalMinutes / 60).toFixed(0).padStart(2, '0');
    const minutes = Math.floor(totalMinutes % 60).toFixed(0).padStart(2, '0');
    const totalDays = Math.floor(worldTime.time / worldTime.dayLength);
    const day = ((totalDays % 30) + 1).toFixed(0).padStart(2, '0');
    const month = Math.floor(((totalDays / 30) % 12) + 1).toFixed(0).padStart(2, '0');
    const year = Math.floor(totalDays / (30 * 12)).toFixed(0).padStart(2, '0');;
    const message = `Day ${day}/${month}/${year} ${hours}:${minutes}h`;

    context.font = "60px bold sans-serif";
    context.fillStyle = "WHITE";
    context.fillText(
      message,
      mapData.tileSize,
      mapData.tileSize,
    );

    if (DEBUG) {
      //drawGrid(TILE_SIZE, camera, rgeCanvas, "#FFFFFFAA");
    }

    context.closePath();
  }
}

function doObjects(player: Entity, objectsStorage: ObjectStorage, mapData: MapData) {
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

    if ((object.id === EntityEnum.FIREPLACE || object.id === EntityEnum.TORCH) && object.isAlive) {
      updateMapFogBasedOnObject(player, object, mapData);

      const passed = Date.now() - object.spawnTimestamp;
      if (passed > object.memory) {
        object.isAlive = false;
        object.facing = CompassEnum.EAST
      }
    }
  });
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
      let newPathToFollow: Vector2[] = [];

      const normalizedEnemyDirection = normalizedDirection[enemy.facing];

      const enemyToPlayerVector: Vector2 = {
        x: player.position.x - enemy.position.x,
        y: player.position.y - enemy.position.y
      };

      const isPlayerAheadEnemy =
        normalizedEnemyDirection.x * enemyToPlayerVector.x + normalizedEnemyDirection.y * enemyToPlayerVector.y >= 0;

      if (enemy.memoryTimestamp !== null || isPlayerAheadEnemy) {
        newPathToFollow = getLineOfSightPath(mapData, enemy.position, player.position);
      }

      const hasLineOfSightToPlayer = newPathToFollow.length > 0;

      if (Date.now() - (enemy?.memoryTimestamp ?? 0) > enemy.memory) {
        enemy.pathToFollow = [];
        enemy.memoryTimestamp = null;
      }

      if (hasLineOfSightToPlayer) {
        enemy.pathToFollow = newPathToFollow;
        enemy.memoryTimestamp = Date.now();
        enemy.color = "GREEN";
      }
      else {
        enemy.color = enemy.memoryTimestamp === null ? "RED" : "BLUE";
      }

      if (enemy.pathToFollow.length > 0) {
        const nextPosition = enemy.pathToFollow.splice(0, 1)[0];

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
            enemy.pathToFollow.unshift(nextPosition);
          }
        }
      }
      else {
        if (enemy.memoryTimestamp === null) {
          if (rand(0, 10000) < 15) {
            enemy.memoryTimestamp = Date.now() + (enemy.memory * .2);
          }
        }
        else {
          const direction: Vector2 = computeRandomDirection();
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

    const newKey = getEntityStorageKey({
      x: enemy.position.x + enemy.direction.x,
      y: enemy.position.y + enemy.direction.y
    });

    if (enemiesStorage[newKey] === undefined) {
      enemiesStorage[newKey] = [enemy];
    } else {
      enemiesStorage[newKey].unshift(enemy);
    }

    if (enemy.message !== null && Date.now() - enemy.message.talkedTimestamp > enemy.message.durationTimestamp) {
      enemy.message = null;
    }
    else if (rand(0, 10000) < 15) {
      const text = messages[rand(0, messages.length - 1)];

      if (text) {
        enemy.message = {
          durationTimestamp: 5000,
          id: 0,
          position: { x: enemy.position.x, y: enemy.position.y },
          talkedTimestamp: Date.now(),
          text,
          viewDistance: 5
        }
      }
    }
  });
}

const compass: CompassEnum[] = [CompassEnum.EAST, CompassEnum.SOUTH, CompassEnum.NORTH, CompassEnum.WEST];
function computeRandomDirection(): Vector2 {
  const directionIndex = compass[rand(0, Object.values(normalizedDirection).length)];
  return normalizedDirection[directionIndex ?? CompassEnum.NORTH];
}
