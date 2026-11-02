import type { Entity, MapData, SpriteSheet } from "./models.js";

export function initPlayer(player: Entity, mapData: MapData, gameSprites: SpriteSheet): void {
  player.sprite = {
    spriteSheet: gameSprites,
    position: { x: 4, y: 1 }
  };

  player.position.x = mapData.spawnPosition.x;
  player.position.y = mapData.spawnPosition.y;

  player.body.x = player.position.x;
  player.body.y = player.position.y;
}
