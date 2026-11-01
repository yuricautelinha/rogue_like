import { type MapData, type TileMapData, TileTypeEnum, type MapSprite, type TileMap } from "./models.js";
import { rand } from "./utils.js";

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

export const mapData = {
  "width": 16,
  "height": 16,
  "map": [
    [
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1
    ],
    [
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      1
    ],
    [
      1,
      1,
      1,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
      1
    ],
    [
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      1
    ],
    [
      1,
      1,
      1,
      0,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      1
    ],
    [
      1,
      1,
      1,
      0,
      1,
      1,
      0,
      0,
      1,
      0,
      1,
      1,
      1,
      0,
      0,
      1
    ],
    [
      1,
      1,
      1,
      0,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1
    ],
    [
      1,
      1,
      1,
      0,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      1,
      1,
      0,
      1,
      1
    ],
    [
      1,
      1,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      1
    ],
    [
      1,
      1,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      1
    ],
    [
      1,
      1,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      1
    ],
    [
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      1
    ],
    [
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      1,
      0,
      1,
      0,
      0,
      1
    ],
    [
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1
    ],
    [
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1
    ],
    [
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1
    ]
  ],
  "tiles": [
    {
      "type": 0,
      "color": "GREEN"
    },
    {
      "type": 1,
      "color": "#202020"
    }
  ],
  "tileSize": 64
}
