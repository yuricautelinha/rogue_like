import { DEFAULT_PLAYER_MEMORY, DEFAULT_PLAYER_SPEED, DEFAULT_PLAYER_VIEW_DISTANCE } from "./constants.js";
import type { Camera, MapData, RGE_Canvas, EntityStorage, Vector2, PlayerEntity, CreatureEntity } from "./models.js";
import { CompassEnum } from "./models.js";

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export function loadCanvas(elementId: string): RGE_Canvas {
  const canvas = document.getElementById(elementId);

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("no canvas");
  }

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("no canvas 2d context");
  }

  return { canvas, context };
}

export function loadImage(imageId: string): HTMLImageElement {
  const img = document.getElementById(imageId);

  if (!(img instanceof HTMLImageElement)) {
    throw new Error("Image not found");
  }

  return img;
}

export function loadButton(elementId: string): HTMLButtonElement {
  const button = document.getElementById(elementId);

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error("Button not found");
  }

  return button;
}

export function loadInput(elementId: string): HTMLInputElement {
  const button = document.getElementById(elementId);

  if (!(button instanceof HTMLInputElement)) {
    throw new Error("Input not found");
  }

  return button;
}

export function clearCanvas(color: string, rgeCanvas: RGE_Canvas): void {
  const { width, height } = rgeCanvas.canvas;

  rgeCanvas.context.fillStyle = color;
  rgeCanvas.context.fillRect(0, 0, width, height);
}

export function drawGrid(
  tileSize: number,
  camera: Camera,
  { canvas, context }: RGE_Canvas,
  strokeColor = "WHITE"
) {
  const xCount = (canvas.width / tileSize) + 1;
  const yCount = (canvas.height / tileSize) + 1;

  const offsetX = camera.position.x % 1;
  const offsetY = camera.position.y % 1;

  context.strokeStyle = strokeColor;
  for (let y = 0; y < yCount; ++y) {
    for (let x = 0; x < xCount; ++x) {
      context.rect(
        (x - offsetX) * tileSize,
        (y - offsetY) * tileSize,
        tileSize,
        tileSize
      );
    }
  }
  context.stroke();
}

export const vectorMagnitude = (vector2: Vector2): number =>
  Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

export const normalizeVector2 = (vector2: Vector2): Vector2 => {
  const magnitude = vectorMagnitude(vector2);

  if (magnitude === 0) return vector2;

  return { x: vector2.x / magnitude, y: vector2.y / magnitude };
};

export const rand = (min: number = 0, max: number = 10): number =>
  Math.floor(Math.random() * (max - min + 1) + min);

export const sleep = (sleepTime: number) =>
  new Promise(resolve => setTimeout(resolve, sleepTime))

export function saveMapToLocalStorage(mapData: MapData) {
  localStorage.setItem('map', JSON.stringify(mapData));
}

export function loadMapFromLocalStorage(player: PlayerEntity, enemiesStorage: EntityStorage<CreatureEntity>, mapData: MapData) {
  const mapString = localStorage.getItem('map');

  if (!mapString) {
    console.error("No map saved on local storage");
    return;
  }

  try {
    const newMapData = JSON.parse(mapString);

    mapData.height = newMapData.height;
    mapData.width = newMapData.width;
    mapData.tileSize = newMapData.tileSize;
    mapData.map = newMapData.map;
    mapData.spawnPosition = newMapData.spawnPosition;
    //mapData.tilesData = newMapData.tilesData;
    //mapData.mapSprite = newMapData.mapSprite;

    player.position.x = newMapData.spawnPosition.x;
    player.position.y = newMapData.spawnPosition.y;
    player.movment.body.x = player.position.x;
    player.movment.body.y = player.position.y;

    player.eyes.memory.duration = DEFAULT_PLAYER_MEMORY;
    player.eyes.viewDistance = DEFAULT_PLAYER_VIEW_DISTANCE;
    player.movment.speed = DEFAULT_PLAYER_SPEED;
    player.health.isAlive = true;

    Object.values(enemiesStorage).forEach(enemies => enemies.splice(0, enemies.length));
  } catch (error) {
    console.error("Map corrupted. Could not parse it.");
    return;
  }
}

export const compassDirections: Record<CompassEnum, Vector2> = {
  [CompassEnum.NORTH]: { x: 0, y: -1 },
  [CompassEnum.NORTH_EAST]: { x: -1, y: -1 },
  [CompassEnum.NORTH_WEST]: { x: 1, y: -1 },
  [CompassEnum.SOUTH]: { x: 0, y: 1 },
  [CompassEnum.SOUTH_EAST]: { x: -1, y: 1 },
  [CompassEnum.SOUTH_WEST]: { x: 1, y: 1 },
  [CompassEnum.WEST]: { x: -1, y: 0 },
  [CompassEnum.EAST]: { x: 1, y: 0 },
};

export const directionToSpritePosition: Record<string, number> = {
  [`0,-1`]: 0,
  [`0,1`]: 2,
  [`-1,0`]: 3,
  [`1,0`]: 1,
  [`1,-1`]: 1,
  [`-1,-1`]: 3,
  [`1,1`]: 1,
  [`-1,1`]: 3,
};

export function getOrThrow<T>(arr: T[], index: number): T {
  const value = arr[index];

  if (!value) {
    throw new Error("Not able to get");
  }

  return value;
}


