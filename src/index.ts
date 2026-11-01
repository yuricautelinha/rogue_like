import { HEIGHT, OUTBOUNDED_INDEX, TILE_SIZE, WIDTH } from "./constants.js";
import { generateMap, generateMapData } from "./map.js";
import { type MapData, type Camera, type RGE_Canvas, type Player, type DirectionKeyboardInput, type SpriteSheet, type MapSprite, TileTypeEnum, CompassEnum } from "./models.js";
import { addDirectionKeyboardInput, clearCanvas, drawGrid, loadCanvas, loadImage, removeDirectionKeyboardInput } from "./utils.js";

const DEBUG = 0;
const rgeCanvas = loadCanvas("game");
const { canvas, context } = rgeCanvas;

context.imageSmoothingEnabled = false;

const player: Player = {
  id: 0,
  color: "WHITE",
  position: { x: 0, y: 0, },
  body: { x: 0, y: 0, },
  direction: { x: 0, y: 0, },
  speed: 1.2,
  speedModifier: 1,
  facing: CompassEnum.NORTH
};

const camera: Camera = {
  position: { x: 0, y: 0 },
  direction: { x: 0, y: 0 }
};

const inputs: DirectionKeyboardInput[] = [];

window.addEventListener("load", main);

function main() {
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

  const mapData = generateMapData(TILE_SIZE, 1024, 720, mapSprite);
  const { x, y } = generateMap(mapData);

  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  player.sprite = {
    spriteSheet: gameSprites,
    position: { x: 4, y: 1 }
  };

  player.position.x = x;
  player.position.y = y;

  player.body.x = player.position.x;
  player.body.y = player.position.y;

  setupKeyEvents(inputs);

  requestAnimationFrame(gameLoop(mapData, 0));
};

function gameLoop(mapData: MapData, lastTime: number) {
  return function(time: number) {
    const dt = (time - lastTime) / 1000;

    movePlayer(player, mapData, inputs, dt);
    moveCamera(camera, mapData, canvas);

    context.beginPath();
    clearCanvas(rgeCanvas);
    drawMap(camera, mapData, rgeCanvas);

    if (DEBUG) {
      drawGrid(TILE_SIZE, camera, rgeCanvas, "#FFFFFFAA");
    }

    drawPlayer(player, camera, mapData, context);
    context.closePath();

    requestAnimationFrame(gameLoop(mapData, time));
  }
}

function moveCamera(
  camera: Camera,
  mapData: MapData,
  canvas: HTMLCanvasElement
) {
  const tilesX = Math.floor(canvas.width / mapData.tileSize);
  const tilesY = Math.floor(canvas.height / mapData.tileSize);

  camera.position.x = Math.min(Math.max(player.body.x - tilesX / 2, 0), mapData.width - tilesX);
  camera.position.y = Math.min(Math.max(player.body.y - tilesY / 2, 0), mapData.height - tilesY);
}

function movePlayer(
  player: Player,
  mapData: MapData,
  inputs: DirectionKeyboardInput[],
  dt: number
) {
  const inputDirection = inputs[0];

  if (!player.direction.x && !player.direction.y) {
    if (inputDirection) {
      player.direction.x = inputDirection.direction.x;
      player.direction.y = inputDirection.direction.y;
    } else {
      return;
    }
  }

  const x = player.position.x + player.direction.x;
  const y = player.position.y + player.direction.y;

  const tileIndex = mapData.map[y]?.[x];

  if (mapData.tiles[tileIndex ?? OUTBOUNDED_INDEX]?.type === TileTypeEnum.GROUND) {
    player.body.x = player.body.x + player.direction.x * (player.speed * player.speedModifier) * dt;
    player.body.y = player.body.y + player.direction.y * (player.speed * player.speedModifier) * dt;

    if (player.body.x >= x && player.direction.x > 0
      || player.body.x <= x && player.direction.x < 0
      || player.body.y >= y && player.direction.y > 0
      || player.body.y <= y && player.direction.y < 0) {
      player.direction.x = 0;
      player.position.x = x;
      player.body.x = x;

      player.direction.y = 0;
      player.position.y = y;
      player.body.y = y;
    }
  } else {
    player.direction.x = 0;
    player.direction.y = 0;
  }
}

function drawMap(
  camera: Camera,
  { map, mapSprite, tileSize, tiles }: MapData,
  { canvas, context }: RGE_Canvas,
): void {
  const tilesX = Math.ceil(canvas.width / tileSize) + 1;
  const tilesY = Math.ceil(canvas.height / tileSize) + 1;

  const offsetX = camera.position.x % 1;
  const offsetY = camera.position.y % 1;

  const cx = Math.floor(camera.position.x);
  const cy = Math.floor(camera.position.y);

  for (let y = 0; y < tilesY; ++y) {
    for (let x = 0; x < tilesX; ++x) {
      const tile = tiles[map?.[y + cy]?.[x + cx] ?? OUTBOUNDED_INDEX];

      if (!tile) {
        continue;
      }

      context.drawImage(
        mapSprite.spriteSheet.sprites,
        tile.sprite.position.x * tile.sprite.spriteSheet.tileSize,
        tile.sprite.position.y * tile.sprite.spriteSheet.tileSize,
        tile.sprite.spriteSheet.tileSize,
        tile.sprite.spriteSheet.tileSize,
        (x - offsetX) * tileSize,
        (y - offsetY) * tileSize,
        tileSize,
        tileSize
      );
    }
  }
}

function drawPlayer(
  player: Player,
  camera: Camera,
  { tileSize }: MapData,
  context: CanvasRenderingContext2D
): void {
  const padding = 20;
  const x = (player.body.x - camera.position.x) * tileSize + padding / 2;
  const y = (player.body.y - camera.position.y) * tileSize + padding / 2;
  const size = tileSize - padding;

  if (DEBUG) {
    context.fillStyle = "RED";
    context.fillRect(
      (player.position.x - camera.position.x) * tileSize,
      (player.position.y - camera.position.y) * tileSize,
      tileSize,
      tileSize
    );

    context.fillStyle = "BLACK";
    context.fillRect(
      (player.position.x + player.direction.x - camera.position.x) * tileSize,
      (player.position.y + player.direction.y - camera.position.y) * tileSize,
      tileSize,
      tileSize
    );

    context.fillStyle = player.color;
    context.fillRect(x, y, size, size);
  }

  if (!player.sprite) {
    throw new Error("Player has no sprite");
  }

  context.drawImage(
    player.sprite.spriteSheet.sprites,
    (player.sprite.position.x + player.facing) * player.sprite.spriteSheet.tileSize,
    player.sprite.position.y * player.sprite.spriteSheet.tileSize,
    player.sprite.spriteSheet.tileSize,
    player.sprite.spriteSheet.tileSize,
    x,
    y,
    size,
    size,
  );
}

function setupKeyEvents(inputs: DirectionKeyboardInput[]): void {
  let s = 0;

  window.addEventListener("keydown", (event) => {
    switch (event.key) {
      case ('w'):
        addDirectionKeyboardInput({
          id: event.key,
          direction: { x: 0, y: -1 }
        }, inputs);
        player.facing = CompassEnum.NORTH;
        break;
      case ('s'):
        addDirectionKeyboardInput({
          id: event.key,
          direction: { x: 0, y: 1 }
        }, inputs);
        player.facing = CompassEnum.SOUTH;
        break;
      case ('a'):
        addDirectionKeyboardInput({
          id: event.key,
          direction: { x: -1, y: 0 }
        }, inputs);
        player.facing = CompassEnum.WEST;
        break;
      case ('d'):
        addDirectionKeyboardInput({
          id: event.key,
          direction: { x: 1, y: 0 }
        }, inputs);
        player.facing = CompassEnum.EAST;
        break;
      case ('v'):
        player.speedModifier = 3;
        break;
      case ('g'):
        if (player.sprite) {
          switch((s++) % 3) {
            case (0):
              player.sprite.position.x = 4;
              player.sprite.position.y = 1;
              break;
            case (1):
              player.sprite.position.x = 0;
              player.sprite.position.y = 1;
              break;
          };
        }
        break;
    }
  });

  window.addEventListener("keyup", (event) => {
    switch (event.key) {
      case ('w'):
        removeDirectionKeyboardInput({
          id: event.key,
          direction: { x: 0, y: -1 }
        }, inputs);
        break;
      case ('s'):
        removeDirectionKeyboardInput({
          id: event.key,
          direction: { x: 0, y: 1 }
        }, inputs);
        break;
      case ('a'):
        removeDirectionKeyboardInput({
          id: event.key,
          direction: { x: -1, y: 0 }
        }, inputs);
        break;
      case ('d'):
        removeDirectionKeyboardInput({
          id: event.key,
          direction: { x: 1, y: 0 }
        }, inputs);
        break;
      case ('v'):
        player.speedModifier = 1;
        break;
    }
  });
}

export function centerCameraToPlayer(
  camera: Camera,
  { tileSize }: MapData,
  canvas: HTMLCanvasElement
) {
  camera.position.x = (player.body.x - canvas.width / 2) / tileSize;
  camera.position.y = (player.body.y - canvas.height / 2) / tileSize;
}
