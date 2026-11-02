import { moveCamera } from "./camera.js";
import { HEIGHT, OUTBOUNDED_INDEX, TILE_SIZE, WIDTH } from "./constants.js";
import { setupKeyEvents } from "./controls.js";
import { drawMap, generateMap, generateMapData, updateMapFog, updateMapWithoutFog } from "./map.js";
import { type MapData, type Camera, type Entity, type DirectionKeyboardInput, type SpriteSheet, type MapSprite, CompassEnum, TileTypeEnum, type KeyboardInput, normalizedDirection, KeyboardInputTypeEnum } from "./models.js";
import { drawEntities, drawEntity, moveEntity } from "./entity.js";
import { clearCanvas, drawGrid, loadButton, loadCanvas, loadImage, loadInput, loadMapFromLocalStorage, rand, saveMapToLocalStorage } from "./utils.js";
import { initPlayer } from "./player.js";

let DEBUG = true;
const rgeCanvas = loadCanvas("game");
const { canvas, context } = rgeCanvas;

context.imageSmoothingEnabled = false;

window.addEventListener("load", main);

function main() {
  const defaultPlayerSpeed = 1.2;
  const defaultPlayerViewDistance = 2;
  const directionalInputs: DirectionKeyboardInput[] = [];
  const controlInputs: KeyboardInput[] = [];

  const player: Entity = {
    id: 0,
    viewDistance: defaultPlayerViewDistance,
    color: "WHITE",
    position: { x: 0, y: 0, },
    body: { x: 0, y: 0, },
    direction: { x: 0, y: 0, },
    speed: defaultPlayerSpeed,
    facing: CompassEnum.NORTH,
    memory: 5000
  };

  const enemies: Entity[] = [];

  const camera: Camera = {
    position: { x: 0, y: 0 },
    direction: { x: 0, y: 0 },
    speed: defaultPlayerSpeed,
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

  const mapData = generateMap(generateMapData(TILE_SIZE, 64, 64, mapSprite));

  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  loadButton("load-map-button").addEventListener("click", () => loadMapFromLocalStorage(player, mapData));

  loadButton("save-map-button").addEventListener("click", () => saveMapToLocalStorage(mapData));

  loadButton("debug-button").addEventListener("click", () => {
    DEBUG = !DEBUG;
  });

  loadButton("freelook-button").addEventListener("click", () => {
    camera.freelook = !camera.freelook;
  });

  loadButton("set-player-speed-to-default-button").addEventListener("click", () => {
    player.speed = defaultPlayerSpeed;
    camera.speed = player.speed;
  });

  loadButton("set-player-view-distance-to-default-button").addEventListener("click", () => {
    player.viewDistance = defaultPlayerViewDistance;
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

  canvas.addEventListener("click", event => {
    if (!DEBUG) {
      return;
    }

    const position = {
      x: Math.floor((event.offsetX + camera.position.x) / mapData.tileSize + camera.position.x),
      y: Math.floor((event.offsetY + camera.position.y) / mapData.tileSize + camera.position.y),
    };

    const enemyFoundedIndex = enemies.findIndex(enemy => enemy.position.x === position.x && enemy.position.y === position.y);

    if (enemyFoundedIndex !== OUTBOUNDED_INDEX) {
      enemies.splice(0, 1);
      return;
    }

    const mapTile = mapData.map?.[position.y]?.[position.x];

    if (mapData.tilesData[mapTile?.tileMapDataId ?? OUTBOUNDED_INDEX]?.type === TileTypeEnum.WALL) {
      return;
    }

    const enemy: Entity = {
      id: 1, // TODO: make ID dynamic
      viewDistance: 4,
      color: "RED",
      position,
      body: { x: position.x, y: position.y },
      direction: { x: 0, y: 0, },
      speed: defaultPlayerSpeed,
      facing: CompassEnum.SOUTH,
      memory: 5000,
      sprite: {
        spriteSheet: gameSprites,
        position: { x: 0, y: 1 }
      }
    };

    enemies.push(enemy);
  });

  initPlayer(player, mapData, gameSprites);
  setupKeyEvents(player, directionalInputs, controlInputs);
  requestAnimationFrame(
    gameLoop(
      player,
      camera,
      directionalInputs,
      controlInputs,
      mapData,
      enemies,
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
  enemies: Entity[],
  lastTime: number
) {
  return function(time: number) {
    const dt = (time - lastTime) / 1000;

    if (!camera.freelook) {
      moveEntity(player, mapData, directionalInputs, controlInputs, dt);
    }
    moveCamera(player, camera, mapData, directionalInputs, canvas, dt);
    moveEnemies(mapData, enemies, dt);

    if (DEBUG) {
      updateMapWithoutFog(mapData, camera, canvas);
    } else {
      updateMapFog(player, camera, mapData, canvas);
    }

    context.beginPath();

    clearCanvas("#000", rgeCanvas);
    drawMap(camera, mapData, rgeCanvas);
    drawEntities(camera, mapData, enemies, context, DEBUG);
    drawEntity(player, camera, mapData, context, DEBUG);

    if (DEBUG) {
      drawGrid(TILE_SIZE, camera, rgeCanvas, "#FFFFFFAA");
    }

    context.closePath();

    requestAnimationFrame(
      gameLoop(
        player,
        camera,
        directionalInputs,
        controlInputs,
        mapData,
        enemies,
        time
      )
    );
  }
}

function moveEnemies(mapData: MapData, enemies: Entity[], deltaTime: number): void {
  enemies.forEach(enemy => {
    const shouldMove = enemy.direction.x === 0 && enemy.direction.y === 0;
    const directionIndex = compass[rand(0, Object.values(normalizedDirection).length)];
    const control: DirectionKeyboardInput[] = !shouldMove ? [] : [{
      id: 'rand',
      direction: normalizedDirection[directionIndex ?? CompassEnum.NORTH],
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

const compass: CompassEnum[] = [CompassEnum.EAST, CompassEnum.SOUTH, CompassEnum.NORTH, CompassEnum.WEST];
