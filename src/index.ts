import { moveCamera } from "./camera.js";
import { creatureMessages, DEFAULT_PLAYER_MEMORY, DEFAULT_PLAYER_SPEED, MAP_TILES_HEIGHT, MAP_TILES_WIDTH, TILE_SIZE } from "./constants.js";
import { setupKeyEvents } from "./controls.js";
import { drawMap, generateMap, generateMapData, getLineOfSightPath, updateMapWithoutFog } from "./map.js";
import { type MapData, type Camera, type DirectionKeyboardInput, type SpriteSheet, type MapSprite, CompassEnum, type KeyboardInput, normalizedDirection, KeyboardInputTypeEnum, type Vector2, type RGE_Canvas, EntityTypeEnum, type EntityStorage, type SpatialIndex, type Player, type Torch, isEntityBeignThatMoves, isEntityBeignThaFollowsAPath, isEntityThatEmitsTextSentence } from "./models.js";
import { addEntity, drawEntities, getPlayerEntity, getSpatialIndexSetByPosition, moveEntity } from "./entity.js";
import { clearCanvas, loadCanvas, loadImage, rand, sleep } from "./utils.js";

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
  });

  context.imageSmoothingEnabled = false;

  const gameSprites: SpriteSheet = {
    sprites: loadImage("game-sprites"),
    tileSize: 32,
  };

  const camera: Camera = {
    position: { x: 0, y: 0 },
    direction: { x: 0, y: 0 },
    speed: DEFAULT_PLAYER_SPEED,
    freelook: false,
  };

  const mapSprite: MapSprite = {
    spriteSheet: gameSprites,
    tileTypeSpriteCount: 4,
    groundOffset: 1,
    wallOffset: 5
  };

  let mapData = await generateMap(generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapSprite));
  const miniMapData: MapData = { ...mapData, tileSize: miniMap.canvas.width / MAP_TILES_WIDTH };

  const player: Player = {
    id: 0,
    type: EntityTypeEnum.PLAYER,
    isAlive: true,
    memory: {
      hasMemory: false,
      initialTimestamp: 0,
    },
    viewDistance: 0,
    color: "WHITE",
    position: { x: mapData.spawnPosition.x, y: mapData.spawnPosition.y, },
    bodyPosition: { x: mapData.spawnPosition.x, y: mapData.spawnPosition.y, },
    direction: { x: 0, y: 0, },
    speed: DEFAULT_PLAYER_SPEED,
    facing: CompassEnum.NORTH,
    memoryDuration: DEFAULT_PLAYER_MEMORY,
    sprite: {
      spriteSheet: gameSprites,
      current: 0,
      positions: [{ x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 }]
    }
  };

  const playerTorch: Torch = {
    id: 1,
    type: EntityTypeEnum.TORCH,
    color: "ORANGE",
    duration: 5000,
    elapsedDuration: 0,
    intensity: 3,
    position: player.bodyPosition,
    sprite: {
      spriteSheet: gameSprites,
      current: 0,
      positions: [{ x: 0, y: 3 }, { x: 1, y: 3 }]
    }
  };

  const directionalInputs: DirectionKeyboardInput[] = [];
  const controlInputs: KeyboardInput[] = [];
  const entityStorage: EntityStorage = new Map();
  const spatialIndex: SpatialIndex = new Map();

  addEntity(player, spatialIndex, entityStorage);
  addEntity(playerTorch, spatialIndex, entityStorage);

  // TODO: Should do this when update map
  miniMap.canvas.width = 300;
  miniMap.canvas.height = miniMapData.tileSize * MAP_TILES_HEIGHT;

  //debugButtons(player, enemies, camera, mapData, () => DEBUG = !DEBUG);

  // canvas.addEventListener("click", (event) => {
  //   event.preventDefault();
  //   if (loadInput("enemy").checked) {
  //     addEnemyBasedOnMousePosition(
  //       camera,
  //       mapData,
  //       enemies,
  //       DEFAULT_PLAYER_SPEED,
  //       gameSprites,
  //       1,
  //       DEBUG
  //     )(event);
  //   } else {
  //     addObjectBasedOnMousePosition(
  //       camera,
  //       mapData,
  //       objects,
  //       gameSprites,
  //       DEBUG
  //     )(event);
  //   }
  // });

  window.addEventListener("keydown", (event) => {
    if (event.key === ' ') {
      PAUSED = !PAUSED;
    }
  });

  //doMiniMap(player, miniMapData, miniMap);

  setupKeyEvents(player, directionalInputs, controlInputs);
  requestAnimationFrame(
    gameLoop(
      camera,
      directionalInputs,
      controlInputs,
      mapData,
      miniMapData,
      entityStorage,
      spatialIndex,
      rgeCanvas,
      miniMap,
      0
    )
  );
};

function gameLoop(
  camera: Camera,
  directionalInputs: DirectionKeyboardInput[],
  controlInputs: KeyboardInput[],
  mapData: MapData,
  miniMapData: MapData,
  entityStorage: EntityStorage,
  spatialIndex: SpatialIndex,
  rgeCanvas: RGE_Canvas,
  miniMap: RGE_Canvas,
  lastTime: number
) {
  const { canvas, context } = rgeCanvas;

  return function(time: number) {
    if (PAUSED) {
      sleep(1).then(() => {
        requestAnimationFrame(
          gameLoop(
            camera,
            directionalInputs,
            controlInputs,
            mapData,
            miniMapData,
            entityStorage,
            spatialIndex,
            rgeCanvas,
            miniMap,
            time
          )
        );
      });

      return;
    }

    const dt = (time - lastTime) / 1000;

    const player = getPlayerEntity(entityStorage);

    if (player.isAlive) {
      moveCamera(player, camera, mapData, directionalInputs, canvas, dt);
      moveEntities(mapData, entityStorage, spatialIndex, directionalInputs, controlInputs, dt);
    } else {
      player.viewDistance = 0;
      player.memoryDuration = 0;
    }

    updateMapWithoutFog(mapData, camera, canvas);

    context.beginPath();

    clearCanvas("#000", rgeCanvas);
    drawMap(camera, mapData, rgeCanvas);
    drawEntities(camera, mapData, entityStorage, spatialIndex, context, DEBUG);

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
    }

    context.closePath();

    sleep(1).then(() => {
      requestAnimationFrame(
        gameLoop(
          camera,
          directionalInputs,
          controlInputs,
          mapData,
          miniMapData,
          entityStorage,
          spatialIndex,
          rgeCanvas,
          miniMap,
          time
        )
      );
    });
  }
}

// function doObjects(
//   mapData: MapData
//   entityStorage: EntityStorage,
//   objectsStorage: ObjectStorage,
// ) {
//   Object.values(objectsStorage).forEach(objects => {
//     const object = objects[0];
//
//     if (!object) {
//       return;
//     }
//
//     const distanceFromPlayer =
//       Math.abs(object.position.x - player.position.x) + Math.abs(object.position.y - player.position.y);
//
//     if (distanceFromPlayer > 60) {
//       return;
//     }
//
//     if ((object.id === EntityTypeEnum.FIREPLACE || object.id === EntityTypeEnum.TORCH) && object.isAlive) {
//       updateMapFogBasedOnObject(player, object, mapData);
//
//       const passed = Date.now() - object.spawnTimestamp;
//       if (passed > object.memory) {
//         object.isAlive = false;
//         object.facing = CompassEnum.EAST
//       }
//     }
//   });
// }

function moveEntities(
  mapData: MapData,
  entityStorage: EntityStorage,
  spatialIndex: SpatialIndex,
  playerDirectionalInputs: DirectionKeyboardInput[],
  playerControlInputs: KeyboardInput[],
  deltaTime: number
): void {
  const player = getPlayerEntity(entityStorage);

  spatialIndex.forEach(spatial => {
    if (spatial.size === 0) {
      return;
    }

    for (const entityId of spatial.values().take(2)) {
      const entity = entityStorage.get(entityId);

      if (entity === undefined) {
        break;
      }

      if (entity.id === player.id) {
        moveEntity(player, spatialIndex, mapData, playerDirectionalInputs, playerControlInputs, deltaTime);
        continue;
      }

      // TODO: Loop until find someone that can walk?
      if (!isEntityBeignThatMoves(entity) || !isEntityBeignThaFollowsAPath(entity)) {
        continue;
      }

      const distanceFromPlayer =
        Math.abs(entity.position.x - player.position.x) + Math.abs(entity.position.y - player.position.y);

      if (distanceFromPlayer > 60) {
        break;
      }

      const control: DirectionKeyboardInput[] = [];
      const shouldMove = entity.direction.x === 0 && entity.direction.y === 0;

      if (shouldMove) {
        let newPathToFollow: Vector2[] = [];

        const normalizedentityDirection = normalizedDirection[entity.facing];

        const entityToPlayerVector: Vector2 = {
          x: player.position.x - entity.position.x,
          y: player.position.y - entity.position.y
        };

        const isPlayerAheadPlayer =
          normalizedentityDirection.x * entityToPlayerVector.x + normalizedentityDirection.y * entityToPlayerVector.y >= 0;

        if (entity.memory.hasMemory || isPlayerAheadPlayer) {
          newPathToFollow = getLineOfSightPath(mapData, entity.position, player.position);
        }

        const hasLineOfSightToPlayer = newPathToFollow.length > 0;

        if (Date.now() - entity.memory.initialTimestamp > entity.memoryDuration) {
          entity.path = [];
          entity.memory.hasMemory = false;
        }

        if (hasLineOfSightToPlayer) {
          entity.path = newPathToFollow;
          entity.memory.initialTimestamp = Date.now();
          entity.memory.hasMemory = true;
          entity.color = "GREEN";
        }
        else {
          entity.color = entity.memory.hasMemory === null ? "RED" : "BLUE";
        }

        if (entity.path.length > 0) {
          const nextPosition = entity.path.splice(0, 1)[0];

          if (nextPosition !== undefined) {
            const direction: Vector2 = {
              x: nextPosition.x - entity.position.x,
              y: nextPosition.y - entity.position.y,
            };

            if (!hasLineOfSightToPlayer) {
              entity.color = "PURPLE";
            }

            const setFromThisPosition = getSpatialIndexSetByPosition({
              x: entity.position.x + direction.x,
              y: entity.position.y + direction.y
            }, spatialIndex);

            if (
              setFromThisPosition === undefined
              || setFromThisPosition.size === 0
              || setFromThisPosition.has(player.id)) {
              control.push({
                id: 'rand',
                direction,
                type: KeyboardInputTypeEnum.DIRECTIONAL
              });
            } else {
              entity.path.unshift(nextPosition);
            }
          }
        }
        else {
          if (!entity.memory.hasMemory) {
            if (rand(0, 10000) < 15) {
              entity.memory.initialTimestamp = Date.now() + (entity.memoryDuration * .2);
              entity.memory.hasMemory = true;
            }
          }
          else {
            const direction: Vector2 = computeRandomDirection();
            const setFromThisPosition = getSpatialIndexSetByPosition({
              x: entity.position.x + direction.x,
              y: entity.position.y + direction.y
            }, spatialIndex);

            if (
              setFromThisPosition === undefined
              || setFromThisPosition.size === 0
              || setFromThisPosition.has(player.id)) {
              control.push({
                id: 'rand',
                direction,
                type: KeyboardInputTypeEnum.DIRECTIONAL
              });
            }
          }
        }
      }

      moveEntity(entity, spatialIndex, mapData, control, [], deltaTime);

      if (isEntityThatEmitsTextSentence(entity)) {
        if (entity.message !== null
            && Date.now() - entity.message.talkedTimestamp > entity.message.durationTimestamp) {
          entity.message = null;
        }
        else if (rand(0, 10000) < 15) {
          const text = creatureMessages[rand(0, creatureMessages.length - 1)];

          if (text) {
            entity.message = {
              durationTimestamp: 5000,
              id: 0,
              position: { x: entity.position.x, y: entity.position.y },
              talkedTimestamp: Date.now(),
              text,
            }
          }
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
