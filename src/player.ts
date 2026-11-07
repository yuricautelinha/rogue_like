import type { MapData, PlayerEntity } from "./models.js";

export function initPlayer(player: PlayerEntity, mapData: MapData): void {
  player.position.x = mapData.spawnPosition.x;
  player.position.y = mapData.spawnPosition.y;

  player.movment.body.x = player.position.x;
  player.movment.body.y = player.position.y;
}
