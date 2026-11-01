import { moveCamera } from "./camera.js";
import { HEIGHT, OUTBOUNDED_INDEX, TILE_SIZE, WIDTH } from "./constants.js";
import { setupKeyEvents } from "./controls.js";
import { generateMap, generateMapData } from "./map.js";
import { type MapData, type Camera, type RGE_Canvas, type Player, type DirectionKeyboardInput, type SpriteSheet, type MapSprite, CompassEnum, type Vector2, TileTypeEnum, normalizedDirection, type KeyboardInput } from "./models.js";
import { drawPlayer, initPlayer, movePlayer } from "./player.js";
import { clearCanvas, drawGrid, loadButton, loadCanvas, loadImage, loadMapFromLocalStorage, saveMapToLocalStorage } from "./utils.js";

const DEBUG = 0;
const rgeCanvas = loadCanvas("game");
const { canvas, context } = rgeCanvas;

context.imageSmoothingEnabled = false;

window.addEventListener("load", main);

function main() {
  const directionalInputs: DirectionKeyboardInput[] = [];
  const controlInputs: KeyboardInput[] = [];

  const player: Player = {
    id: 0,
    viewDistance: 4,
    color: "WHITE",
    position: { x: 0, y: 0, },
    body: { x: 0, y: 0, },
    direction: { x: 0, y: 0, },
    speed: 1.2,
    facing: CompassEnum.NORTH,
    memory: 5000
  };

  const camera: Camera = {
    position: { x: 0, y: 0 },
    direction: { x: 0, y: 0 }
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

  const mapData = generateMap(generateMapData(TILE_SIZE, 16, 16, mapSprite));

  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  loadButton("load-map-button").addEventListener("click", () => loadMapFromLocalStorage(player, mapData));
  loadButton("save-map-button").addEventListener("click", () => saveMapToLocalStorage(mapData));

  initPlayer(player, mapData, gameSprites);
  setupKeyEvents(player, directionalInputs, controlInputs);
  requestAnimationFrame(gameLoop(player, camera, directionalInputs, controlInputs, mapData, 0));
};

function gameLoop(
  player: Player,
  camera: Camera,
  directionalInputs: DirectionKeyboardInput[],
  controlInputs: KeyboardInput[],
  mapData: MapData,
  lastTime: number
) {
  return function(time: number) {
    const dt = (time - lastTime) / 1000;

    movePlayer(player, mapData, directionalInputs, controlInputs, dt);
    moveCamera(player, camera, mapData, canvas);
    updateFog(player, camera, mapData, canvas);

    context.beginPath();
    clearCanvas("#000", rgeCanvas);
    drawMap(camera, mapData, rgeCanvas);

    if (DEBUG) {
      drawGrid(TILE_SIZE, camera, rgeCanvas, "#FFFFFFAA");
    }

    drawPlayer(player, camera, mapData, context);
    context.closePath();

    requestAnimationFrame(gameLoop(player, camera, directionalInputs, controlInputs, mapData, time));
  }
}

function drawMap(
  camera: Camera,
  { map, mapSprite, tileSize, tilesData: tiles }: MapData,
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
      const mapTile = map?.[y + cy]?.[x + cx];

      if (!mapTile) {
        continue;
      }

      const tileData = tiles[mapTile.tileMapDataId];

      if (!tileData || !mapTile.revelead) {
        continue;
      }

      context.drawImage(
        mapSprite.spriteSheet.sprites,
        tileData.sprite.position.x * tileData.sprite.spriteSheet.tileSize,
        tileData.sprite.position.y * tileData.sprite.spriteSheet.tileSize,
        tileData.sprite.spriteSheet.tileSize,
        tileData.sprite.spriteSheet.tileSize,
        (x - offsetX) * tileSize,
        (y - offsetY) * tileSize,
        tileSize,
        tileSize
      );

      if (!mapTile.visible) {
        context.fillStyle = "#00000099";
        context.fillRect(
          (x - offsetX) * tileSize,
          (y - offsetY) * tileSize,
          tileSize,
          tileSize
        );
      }
    }
  }
}

function updateFog(
  player: Player,
  camera: Camera,
  mapData: MapData,
  canvas: HTMLCanvasElement,
) {
  const { tileSize, map } = mapData;
  const tilesX = Math.ceil(canvas.width / tileSize) + 1;
  const tilesY = Math.ceil(canvas.height / tileSize) + 1;

  const cx = Math.floor(camera.position.x);
  const cy = Math.floor(camera.position.y);

  const px = player.position.x;
  const py = player.position.y;


  const facing = normalizedDirection[player.facing];

  for (let y = 0; y < tilesY; ++y) {
    for (let x = 0; x < tilesX; ++x) {
      const mx = x + cx;
      const my = y + cy;
      const mapTile = map?.[my]?.[mx];

      if (!mapTile) {
        continue;
      }

      const isInFront = player.viewDistance === 0 && mx === px + facing.x && my === py + facing.y;
      const isGoingTo = player.viewDistance === 0 && mx === px + player.direction.x && my === py + player.direction.y;

      mapTile.visible = isGoingTo;
      mapTile.revelead = mapTile.revelead || isGoingTo || isInFront;

      if (isGoingTo || isInFront) {
        mapTile.reveleadDate = Date.now();
      }

      if (!mapTile.reveleadDate || (Date.now() - mapTile.reveleadDate) > player.memory) {
        mapTile.revelead = false;
      }
    }
  }

  for (let y = -player.viewDistance; y < player.viewDistance + 1; ++y) {
    for (let x = -player.viewDistance; x < player.viewDistance + 1; ++x) {
      const mx = px + x;
      const my = py + y;

      const dx = mx - player.position.x;
      const dy = my - player.position.y;
      const pd = normalizedDirection[player.facing];
      const dot = pd.x * dx + pd.y * dy;

      if (dot < 0) continue;

      const mapTile = map?.[my]?.[mx];

      if (!mapTile) {
        continue;
      }

      const hasLightOfSight = validateLineOfSight(
        mapData,
        player.position,
        { x: mx, y: my }
      );

      if (hasLightOfSight) {
        mapTile.visible = true;
        mapTile.revelead = true;
        mapTile.reveleadDate = Date.now();
      }
    }
  }
}

function validateLineOfSight(
  { map, tilesData }: MapData,
  p1: Vector2,
  p2: Vector2
): boolean {
  let x = p1.x;
  let y = p1.y;

  const dx = Math.abs(p2.x - x);
  const dy = Math.abs(p2.y - y);

  const sx = (x < p2.x) ? 1 : -1;
  const sy = (y < p2.y) ? 1 : -1;

  let err = dx - dy;

  while (true) {
    const e2 = 2 * err;

    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }

    if (e2 < dx) {
      err += dx;
      y += sy;
    }

    if (x === p2.x && y === p2.y) {
      return true;
    }

    const mapTile = map?.[y]?.[x];

    const tile = tilesData[mapTile?.tileMapDataId ?? OUTBOUNDED_INDEX];

    if (tile?.type === TileTypeEnum.WALL) {
      return false;
    }
  }
}
