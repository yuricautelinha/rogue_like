import type { Camera, MapData, Player } from "./models.js";

export function moveCamera(
  player: Player,
  camera: Camera,
  mapData: MapData,
  canvas: HTMLCanvasElement
) {
  const tilesX = Math.floor(canvas.width / mapData.tileSize);
  const tilesY = Math.floor(canvas.height / mapData.tileSize);

  camera.position.x = Math.min(Math.max(player.body.x - tilesX / 2, 0), mapData.width - tilesX);
  camera.position.y = Math.min(Math.max(player.body.y - tilesY / 2, 0), mapData.height - tilesY);
}

export function centerCameraToPlayer(
  player: Player,
  camera: Camera,
  { tileSize }: MapData,
  canvas: HTMLCanvasElement
) {
  camera.position.x = (player.body.x - canvas.width / 2) / tileSize;
  camera.position.y = (player.body.y - canvas.height / 2) / tileSize;
}
