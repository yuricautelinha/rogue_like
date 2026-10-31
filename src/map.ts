import { type MapData, type TileMap, TileTypeEnum, type MapSprite } from "./models.js";
import { rand } from "./utils.js";

export function generateMapData(
  tileSize: number,
  width: number,
  height: number,
  mapSprite: MapSprite,
): MapData {
  const map: number[][] =
    new Array(height).fill(0).map(() =>
      new Array(width)
        .fill(mapSprite.wallOffset)
        .map(wallOffset => wallOffset - 1 + rand(0, mapSprite.tileTypeSpriteCount - 1))
    );

  const tiles: TileMap[] = new Array(mapSprite.tileTypeSpriteCount)
    .fill(null)
    .map((_, x: number): TileMap => ({
      type: TileTypeEnum.GROUND,
      sprite: {
        spriteSheet: mapSprite.spriteSheet,
        position: { x: x + mapSprite.groundOffset, y: 0 }
      },
      color: "GREEN"
    })).concat(
      new Array(mapSprite.tileTypeSpriteCount)
        .fill(null)
        .map((_, x: number): TileMap => ({
          type: TileTypeEnum.WALL,
          sprite: {
            spriteSheet: mapSprite.spriteSheet,
            position: { x: x + mapSprite.wallOffset, y: 0 }
          },
          color: "#202020"
        }))
    );

  return { width, height, map, tiles, tileSize, mapSprite };
}

export function generateMap({ tiles, map, width, height, mapSprite }: MapData): { x: number; y: number } {
  const coverage = 20 + rand(0, 15);

  let n = (width * height) * (coverage * 0.01);
  let x = 1 + rand(0, width - 2);
  let y = 1 + rand(0, height - 2);

  let dx = 0;
  let dy = 0;
  let straight = 0;

  const tile = map[y];
  if (tile !== undefined) {
    tile[x] = rand(0, mapSprite.tileTypeSpriteCount - 1);
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

    const mapY = map[y];

    if (!mapY) {
      throw new Error("Map y axis not found.");
    }

    const mapX = mapY[x];

    if (mapY[x] !== undefined && mapX && tiles[mapX]?.type === TileTypeEnum.WALL) {
      mapY[x] = rand(0, mapSprite.tileTypeSpriteCount - 1);
      n--;
    }
  }

  return { x, y };
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
