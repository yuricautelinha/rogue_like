import type { Camera, MapData, Player, RGE_Canvas } from "./models.js";

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

export const rand = (min: number = 0, max: number = 10): number =>
  Math.floor(Math.random() * (max - min + 1) + min);

export const sleep = (sleepTime: number) =>
  new Promise(resolve => setTimeout(resolve, sleepTime))

export function saveMapToLocalStorage(mapData: MapData) {
  localStorage.setItem('map', JSON.stringify(mapData));
}

export function loadMapFromLocalStorage(player: Player, mapData: MapData) {
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
    //mapData.tilesData = newMapData.tilesData;
    //mapData.mapSprite = newMapData.mapSprite;

    player.position.x = newMapData.spawnPosition.x;
    player.position.y = newMapData.spawnPosition.y;
    player.body.x = player.position.x;
    player.body.y = player.position.y;
  } catch (error) {
    console.error("Map corrupted. Could not parse it.");
    return;
  }
}
