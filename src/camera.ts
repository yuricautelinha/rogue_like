import type { Camera, MapData, Entity, DirectionKeyboardInput } from "./models.js";

export function moveCamera(
  player: Entity,
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

    camera.position.x = Math.min(Math.max(player.body.x - tilesX / 2, 0), mapData.width - tilesX);
    camera.position.y = Math.min(Math.max(player.body.y - tilesY / 2, 0), mapData.height - tilesY);
  }
}

export function centerCameraToPlayer(
  player: Entity,
  camera: Camera,
  { tileSize }: MapData,
  canvas: HTMLCanvasElement
) {
  camera.position.x = (player.body.x - canvas.width / 2) / tileSize;
  camera.position.y = (player.body.y - canvas.height / 2) / tileSize;
}
