import { OUTBOUNDED_INDEX } from "./constants.js";
import { type MapData, type TileMapData, TileTypeEnum, type MapSprite, type TileMap, type Camera, type RGE_Canvas, type Entity, type Vector2, type AmbientLighting, type WorldTime, type MapTimeColorPallete, type RGBColor, type PlayerEntity, type FireplaceEntity, type TorchEntity } from "./models.js";
import { clearCanvas, rand, sleep } from "./utils.js";

const camera: Camera = {
  direction: { x: 0, y: 0 },
  freelook: false,
  position: { x: 0, y: 0 },
  speed: 0,
}
export function doMiniMap(player: Entity, mapData: MapData, rgeCanvas: RGE_Canvas) {
  clearCanvas("#000", rgeCanvas);
  drawMapAsShapes(camera, mapData, rgeCanvas);

  rgeCanvas.context.fillStyle = "RED";
  rgeCanvas.context.fillRect(
    player.position.x * mapData.tileSize,
    player.position.y * mapData.tileSize,
    mapData.tileSize,
    mapData.tileSize
  );
}

export function drawMap(
  camera: Camera,
  { map, mapSprite, tileSize, tilesData: tiles }: MapData,
  { canvas, context }: RGE_Canvas,
): void {
  const tilesX = Math.ceil(canvas.width / tileSize) + 2;
  const tilesY = Math.ceil(canvas.height / tileSize) + 2;

  const cx = Math.floor(camera.position.x);
  const cy = Math.floor(camera.position.y);

  const offsetX = -(camera.position.x - cx) * tileSize;
  const offsetY = -(camera.position.y - cy) * tileSize;

  for (let y = 0; y < tilesY; ++y) {
    for (let x = 0; x < tilesX; ++x) {
      const mapTile = map?.[y + cy]?.[x + cx] ?? wallTileMap(mapSprite, mapSprite.startWallPosition.x + 1);
      const tileData = tiles[mapTile.tileMapDataId];

      if (!tileData || !mapTile.revelead) {
        continue;
      }

      const screenX = Math.round(x * tileSize + offsetX);
      const screenY = Math.round(y * tileSize + offsetY);

      context.drawImage(
        mapSprite.spriteSheet.asset,
        tileData.sprite.position.x * tileData.sprite.spriteSheet.tileSize,
        tileData.sprite.position.y * tileData.sprite.spriteSheet.tileSize,
        tileData.sprite.spriteSheet.tileSize,
        tileData.sprite.spriteSheet.tileSize,
        screenX,
        screenY,
        tileSize,
        tileSize,
      );
    }
  }
}

export function applyLight(
  camera: Camera,
  mapData: MapData,
  ambientLighting: AmbientLighting,
  worldTime: WorldTime,
  { canvas, context }: RGE_Canvas,
): void {
  const { map, mapSprite, tileSize, tilesData: tiles, timeColorPallete: tiomeColorPallete } = mapData;
  const tilesX = Math.ceil(canvas.width / tileSize) + 2;
  const tilesY = Math.ceil(canvas.height / tileSize) + 2;

  const cx = Math.floor(camera.position.x);
  const cy = Math.floor(camera.position.y);

  const offsetX = -(camera.position.x - cx) * tileSize;
  const offsetY = -(camera.position.y - cy) * tileSize;

  const revealedTileLight = Math.max(ambientLighting.value, ambientLighting.value + 0.3);

  const { r, g, b } = getDayLightColor(tiomeColorPallete, worldTime);

  for (let y = 0; y < tilesY; ++y) {
    for (let x = 0; x < tilesX; ++x) {
      const mapTile = map?.[y + cy]?.[x + cx] ?? wallTileMap(mapSprite, mapSprite.startWallPosition.x + 1);
      const tileData = tiles[mapTile.tileMapDataId];

      if (!tileData || !mapTile.revelead) {
        continue;
      }

      const screenX = Math.round(x * tileSize + offsetX);
      const screenY = Math.round(y * tileSize + offsetY);

      if (mapTile.visible) {
        if (mapTile.visibleBySun) {
          context.fillStyle = `rgba(${r}, ${g}, ${b}, ${ambientLighting.value})`;
          context.fillRect(
            screenX,
            screenY,
            tileSize,
            tileSize,
          );
        } else {
          context.fillStyle = `rgba(${r}, ${g}, ${b}, 0.1)`;
          context.fillRect(
            screenX,
            screenY,
            tileSize,
            tileSize,
          );
        }
      }
      else {
        context.fillStyle = `rgba(0, 0, 0, ${revealedTileLight})`;
        context.fillRect(
          screenX,
          screenY,
          tileSize,
          tileSize,
        );
      }
    }
  }
}

export function getDayLightColor(dayTimeColorPallette: MapTimeColorPallete[], worldTime: WorldTime): RGBColor {
  const t = (worldTime.time / worldTime.dayLength) % 1;
  let toIndex = dayTimeColorPallette.findIndex(c => t <= c.time);
  if (toIndex === OUTBOUNDED_INDEX) toIndex = 1;
  const fromIndex = toIndex - 1;

  const to = dayTimeColorPallette[toIndex] ?? { time: 0, color: { r: 0, g: 0, b: 0 } };
  const from = dayTimeColorPallette[fromIndex] ?? { time: 0, color: { r: 0, g: 0, b: 0 } };

  const tx = (t - from.time) / (to.time - from.time);

  return {
    r: lerp(from.color.r, to.color.r, tx),
    g: lerp(from.color.g, to.color.g, tx),
    b: lerp(from.color.b, to.color.b, tx),
  }
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export function drawMapAsShapes(
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
      const mapTile = map?.[y + cy]?.[x + cx] ?? wallTileMap(mapSprite, mapSprite.startWallPosition.x + 1);
      const tileData = tiles[mapTile.tileMapDataId];

      if (!tileData) {
        continue;
      }

      if (tileData.type === TileTypeEnum.GROUND) {
        context.fillStyle = "#89775c";
      } else {
        context.fillStyle = "#000";
      }
      context.fillRect(
        (x - offsetX) * tileSize,
        (y - offsetY) * tileSize,
        tileSize,
        tileSize
      );
    }
  }
}

export function generateMapData(
  tileSize: number,
  width: number,
  height: number,
  mapSprite: MapSprite,
  ambientLighting: AmbientLighting,
  tiomeColorPallete: MapTimeColorPallete[],
): MapData {
  const map: TileMap[][] =
    new Array(height).fill(0).map(() =>
      new Array(width)
        .fill(mapSprite.startWallPosition)
        .map(() => wallTileMap(mapSprite))
    );

  const tiles: TileMapData[] = new Array(mapSprite.tileTypeSpriteCount)
    .fill(null)
    .map((_, index: number): TileMapData => groundTileMapData(index, mapSprite))
    .concat(
      new Array(mapSprite.tileTypeSpriteCount)
        .fill(null)
        .map((_, index: number): TileMapData => wallTileMapData(index, mapSprite))
    );

  return {
    width,
    height,
    map,
    tilesData: tiles,
    tileSize,
    mapSprite,
    spawnPosition: { x: 0, y: 0 },
    ambientLighting,
    timeColorPallete: tiomeColorPallete
  };
}

export async function generateMap(mapData: MapData): Promise<MapData> {
  const { tilesData: tiles, map, width, height, mapSprite, spawnPosition } = mapData;
  const coverage = 20 + rand(0, 15);

  let n = (width * height) * (coverage * 0.025);
  let x = 1 + rand(0, width - 2);
  let y = 1 + rand(0, height - 2);

  let dx = 0;
  let dy = 0;
  let straight = 0;

  const tile = map[y]?.[x];

  if (tile) {
    tile.tileMapDataId = rand(0, mapSprite.tileTypeSpriteCount - 1);
  }

  const time = Date.now();

  while (n > 0) {
    straight = Math.max(straight - 1, 0);

    if (straight === 0) {
      switch (rand(0, 4)) {
        case (0):
          dx = 0;
          dy = -1;
          break;
        case (1):
          dx = 0;
          dy = 1;
          break;
        case (2):
          dx = -1;
          dy = 0;
          break;
        case (3):
          dx = 1;
          dy = 0;
          break;
        default:
          straight = 4 + rand(0, 7);
          break;
      }
    }

    x = Math.min(Math.max(x + dx, 1), width - 2);
    y = Math.min(Math.max(y + dy, 1), height - 2);

    const tile = map[y]?.[x];

    if (tile && tiles[tile.tileMapDataId]?.type === TileTypeEnum.WALL) {
      tile.tileMapDataId = rand(0, mapSprite.tileTypeSpriteCount - 1);
      n--;
    }

    if (Date.now() - time > 1000 * 2) {
      console.error("Expired time to generate map");
      break;
    }

    if (Date.now() - time > 1000 * 10) {
      await sleep(1);
    }
  }

  spawnPosition.x = x;
  spawnPosition.y = y;

  return mapData;
}

export function updateMapFog(
  player: PlayerEntity,
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

  const facing = player.eyes.direction;

  for (let y = 0; y < tilesY; ++y) {
    for (let x = 0; x < tilesX; ++x) {
      const mx = x + cx;
      const my = y + cy;
      const mapTile = map?.[my]?.[mx];

      if (!mapTile) {
        continue;
      }

      const isInFront = player.eyes.viewDistance === 0 && mx === px + facing.x && my === py + facing.y;
      const isGoingTo = player.eyes.viewDistance === 0 && mx === px + player.movment.direction.x && my === py + player.movment.direction.y;

      mapTile.visible = isGoingTo;
      mapTile.revelead = mapTile.revelead || isGoingTo || isInFront;
      mapTile.visibleBySun = true;

      if (isGoingTo || isInFront) {
        mapTile.reveleadTimestamp = Date.now();
      }

      if (!mapTile.reveleadTimestamp || (Date.now() - mapTile.reveleadTimestamp) > player.eyes.memory.duration) {
        mapTile.revelead = false;
      }
    }
  }

  for (let y = -player.eyes.viewDistance; y < player.eyes.viewDistance + 1; ++y) {
    for (let x = -player.eyes.viewDistance; x < player.eyes.viewDistance + 1; ++x) {
      const dot = facing.x * x + facing.y * y;

      if (dot < 0) continue;

      const mx = px + x;
      const my = py + y;

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
        mapTile.reveleadTimestamp = Date.now();
      }
    }
  }
}

export function updateMapFogBasedOnObject(
  player: PlayerEntity,
  object: FireplaceEntity | TorchEntity,
  mapData: MapData,
) {
  const { map } = mapData;

  const ox = Math.floor(object.position.x);
  const oy = Math.floor(object.position.y);
  const facing = player.eyes.direction;

  for (let y = -object.light.distance; y < object.light.distance + 1; ++y) {
    for (let x = -object.light.distance; x < object.light.distance + 1; ++x) {
      const mx = ox - x;
      const my = oy - y;

      const mapTile = map?.[my]?.[mx];

      if (!mapTile || mapTile.visible && !mapTile.visibleBySun) {
        continue;
      }

      const tileToLight: Vector2 = {
        x: player.position.x - mx,
        y: player.position.y - my
      };

      const isAheadPlayer = (facing.x * tileToLight.x + facing.y * tileToLight.y) <= 0;

      if (!isAheadPlayer) {
        continue;
      }

      const hasLightOfSight = validateLineOfSight(
        mapData,
        player.position,
        { x: mx, y: my },
      );

      if (hasLightOfSight) {
        mapTile.visible = true;
        mapTile.revelead = true;
        mapTile.visibleBySun = false;
        mapTile.reveleadTimestamp = Date.now();
      }
    }
  }
}

export function updateMapWithoutFog(
  { map, tileSize }: MapData,
  camera: Camera,
  canvas: HTMLCanvasElement,
) {
  const tilesX = Math.ceil(canvas.width / tileSize) + 1;
  const tilesY = Math.ceil(canvas.height / tileSize) + 1;

  const cx = Math.floor(camera.position.x);
  const cy = Math.floor(camera.position.y);

  for (let y = 0; y < tilesY; ++y) {
    for (let x = 0; x < tilesX; ++x) {
      const mx = x + cx;
      const my = y + cy;
      const mapTile = map?.[my]?.[mx];

      if (!mapTile) {
        continue;
      }

      mapTile.visible = true;
      mapTile.revelead = true;
    }
  }
}

/**
 * All credit of this function to https://parallelrealities.co.uk/
 */
export function validateLineOfSight(
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

export function getLineOfSightPath(
  { map, tilesData }: MapData,
  p1: Vector2,
  p2: Vector2
): Vector2[] {
  let x = p1.x;
  let y = p1.y;

  const dx = Math.abs(p2.x - x);
  const dy = Math.abs(p2.y - y);

  const sx = (x < p2.x) ? 1 : -1;
  const sy = (y < p2.y) ? 1 : -1;

  let err = dx - dy;

  const path: Vector2[] = [];

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

    path.push({ x, y });

    if (x === p2.x && y === p2.y) {
      return path;
    }

    const mapTile = map?.[y]?.[x];

    const tile = tilesData[mapTile?.tileMapDataId ?? OUTBOUNDED_INDEX];

    if (tile?.type === TileTypeEnum.WALL) {
      return [];
    }
  }
}

const wallTileMapData = (
  index: number,
  mapSprite: MapSprite
): TileMapData => ({
  id: index,
  type: TileTypeEnum.WALL,
  sprite: {
    spriteSheet: mapSprite.spriteSheet,
    position: { x: index + mapSprite.startWallPosition.x, y: mapSprite.startWallPosition.y }
  },
  color: "#202020"
});

const groundTileMapData = (
  index: number,
  mapSprite: MapSprite
): TileMapData => ({
  id: index,
  type: TileTypeEnum.GROUND,
  sprite: {
    spriteSheet: mapSprite.spriteSheet,
    position: { x: index + mapSprite.startGroundPosition.x, y: mapSprite.startGroundPosition.y }
  },
  color: "GREEN"
});


const wallTileMap = (mapSprite: MapSprite, tileMapDataId?: number): TileMap => ({
  tileMapDataId: tileMapDataId ?? rand(mapSprite.startWallPosition.x, mapSprite.startWallPosition.x + mapSprite.tileTypeSpriteCount - 2),
  revelead: false,
  visible: false,
  visibleBySun: true,
  reveleadTimestamp: null,
});
