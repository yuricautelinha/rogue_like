import type { Camera, MapData, DirectionKeyboardInput, Player } from "./models.js";

export function moveCamera(
  player: Player,
  camera: Camera,
  mapData: MapData,
  directionalInputs: DirectionKeyboardInput[],
  canvas: HTMLCanvasElement,
  deltaTime: number
) {
  if (camera.freelook) {
    const inputDirection = directionalInputs[0];

    if (inputDirection) {
      camera.direction.x = inputDirection.direction.x;
      camera.direction.y = inputDirection.direction.y;
    } else {
      camera.direction.x = 0;
      camera.direction.y = 0;
      return;
    }

    camera.position.x = camera.position.x + camera.direction.x * camera.speed * deltaTime;
    camera.position.y = camera.position.y + camera.direction.y * camera.speed * deltaTime;
  } else {
    const tilesX = Math.floor(canvas.width / mapData.tileSize);
    const tilesY = Math.floor(canvas.height / mapData.tileSize);


    camera.position.x = Math.min(Math.max(player.bodyPosition.x - tilesX / 2, 0), mapData.width - tilesX);
    camera.position.y = Math.min(Math.max(player.bodyPosition.y - tilesY / 2, 0), mapData.height - tilesY);
  }
}

export function centerCameraToPlayer(
  player: Player,
  camera: Camera,
  { tileSize }: MapData,
  canvas: HTMLCanvasElement
) {
  camera.position.x = (player.bodyPosition.x - canvas.width / 2) / tileSize;
  camera.position.y = (player.bodyPosition.y - canvas.height / 2) / tileSize;
}
