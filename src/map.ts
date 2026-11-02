import { OUTBOUNDED_INDEX } from "./constants.js";
import { type MapData, type TileMapData, TileTypeEnum, type MapSprite, type TileMap, type Camera, type RGE_Canvas, type Entity, normalizedDirection, type Vector2 } from "./models.js";
import { rand } from "./utils.js";

export function drawMap(
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

export function generateMapData(
  tileSize: number,
  width: number,
  height: number,
  mapSprite: MapSprite,
): MapData {
  const map: TileMap[][] =
    new Array(height).fill(0).map(() =>
      new Array(width)
        .fill(mapSprite.wallOffset)
        .map((wallOffset: number): TileMap => ({
          tileMapDataId: wallOffset - 1 + rand(0, mapSprite.tileTypeSpriteCount - 1),
          revelead: false,
          visible: false,
        }))
    );

  const tiles: TileMapData[] = new Array(mapSprite.tileTypeSpriteCount)
    .fill(null)
    .map((_, index: number): TileMapData => ({
      id: index,
      type: TileTypeEnum.GROUND,
      sprite: {
        spriteSheet: mapSprite.spriteSheet,
        position: { x: index + mapSprite.groundOffset, y: 0 }
      },
      color: "GREEN"
    })).concat(
      new Array(mapSprite.tileTypeSpriteCount)
        .fill(null)
        .map((_, index: number): TileMapData => ({
          id: index,
          type: TileTypeEnum.WALL,
          sprite: {
            spriteSheet: mapSprite.spriteSheet,
            position: { x: index + mapSprite.wallOffset, y: 0 }
          },
          color: "#202020"
        }))
    );

  return { width, height, map, tilesData: tiles, tileSize, mapSprite, spawnPosition: { x: 0, y: 0 } };
}

export function generateMap(mapData: MapData): MapData {
  const { tilesData: tiles, map, width, height, mapSprite, spawnPosition } = mapData;
  const coverage = 20 + rand(0, 15);

  let n = (width * height) * (coverage * 0.01);
  let x = 1 + rand(0, width - 2);
  let y = 1 + rand(0, height - 2);

  let dx = 0;
  let dy = 0;
  let straight = 0;

  const tile = map[y]?.[x];

  if (tile) {
    tile.tileMapDataId = rand(0, mapSprite.tileTypeSpriteCount - 1);
  }

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
  }

  spawnPosition.x = x;
  spawnPosition.y = y;

  return mapData;
}

export function updateMapFog(
  player: Entity,
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

      const pd = normalizedDirection[player.facing];
      const dot = pd.x * x + pd.y * y;

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
