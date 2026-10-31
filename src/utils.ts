import { OUTBOUNDED_INDEX } from "./constants.js";
import type { Camera, DirectionKeyboardInput, RGE_Canvas } from "./models.js";

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

export function clearCanvas(rgeCanvas: RGE_Canvas): void {
  const { width, height } = rgeCanvas.canvas;

  rgeCanvas.context.clearRect(0, 0, width, height);
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

export function addDirectionKeyboardInput(
  input: DirectionKeyboardInput,
  inputs: DirectionKeyboardInput[]
) {
  const index = inputs.findIndex(playerInput => playerInput.id === input.id);

  if (index === OUTBOUNDED_INDEX) {
    inputs.unshift(input);
  }
}

export function removeDirectionKeyboardInput(
  input: DirectionKeyboardInput,
  inputs: DirectionKeyboardInput[]
) {
  const index = inputs.findIndex(playerInput => playerInput.id === input.id);

  if (index === OUTBOUNDED_INDEX) {
    throw new Error("No keyboard event to remove");
  }

  inputs.splice(index, 1);
}

export const rand = (min: number = 0, max: number = 10): number =>
  Math.floor(Math.random() * (max - min + 1) + min);

export const sleep = (sleepTime: number) =>
  new Promise(resolve => setTimeout(resolve, sleepTime))
