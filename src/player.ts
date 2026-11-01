import { OUTBOUNDED_INDEX } from "./constants.js";
import { type Player, type Camera, type MapData, TileTypeEnum, type DirectionKeyboardInput, directionToCompassMap, type KeyboardInput, KeyboardInputTypeEnum, type SpriteSheet } from "./models.js";

export function drawPlayer(
  player: Player,
  camera: Camera,
  { tileSize }: MapData,
  context: CanvasRenderingContext2D,
  DEBUG = 0
): void {
  const x = (player.body.x - camera.position.x) * tileSize;
  const y = (player.body.y - camera.position.y) * tileSize;

  if (DEBUG) {
    const padding = 20;
    const size = tileSize - padding;

    context.fillStyle = "RED";
    context.fillRect(
      (player.position.x - camera.position.x) * tileSize,
      (player.position.y - camera.position.y) * tileSize,
      tileSize,
      tileSize
    );

    context.fillStyle = "BLACK";
    context.fillRect(
      (player.position.x + player.direction.x - camera.position.x) * tileSize,
      (player.position.y + player.direction.y - camera.position.y) * tileSize,
      tileSize,
      tileSize
    );

    context.fillStyle = player.color;
    context.fillRect(
      x + padding / 2,
      y + padding / 2,
      size,
      size
    );
  }

  if (!player.sprite) {
    throw new Error("Player has no sprite");
  }

  context.drawImage(
    player.sprite.spriteSheet.sprites,
    (player.sprite.position.x + player.facing) * player.sprite.spriteSheet.tileSize,
    player.sprite.position.y * player.sprite.spriteSheet.tileSize,
    player.sprite.spriteSheet.tileSize,
    player.sprite.spriteSheet.tileSize,
    x,
    y,
    tileSize,
    tileSize,
  );
}

export function movePlayer(
  player: Player,
  mapData: MapData,
  directionalInputs: DirectionKeyboardInput[],
  controlInputs: KeyboardInput[],
  dt: number
) {
  const inputDirection = directionalInputs[0];

  if (!player.direction.x && !player.direction.y) {
    if (inputDirection) {
      player.direction.x = inputDirection.direction.x;
      player.direction.y = inputDirection.direction.y;
    } else {
      return;
    }
  }

  if (inputDirection) {
    player.facing = directionToCompassMap[`(${inputDirection.direction.x},${inputDirection.direction.y})`] ?? player.facing;
  }

  if (controlInputs.find(control => control.type === KeyboardInputTypeEnum.IDLE)
    && player.position.x === player.body.x && player.position.y === player.body.y) {
    player.direction.x = 0;
    player.direction.y = 0;
    return;
  }

  const x = player.position.x + player.direction.x;
  const y = player.position.y + player.direction.y;

  const mapTile = mapData.map?.[y]?.[x];
  const tileData = mapData.tilesData[mapTile?.tileMapDataId ?? OUTBOUNDED_INDEX];

  const speedModifier = controlInputs.find(control => control.type === KeyboardInputTypeEnum.RUN) ? 3 : 1;

  if (tileData?.type === TileTypeEnum.GROUND) {
    player.body.x = player.body.x + player.direction.x * (player.speed * speedModifier) * dt;
    player.body.y = player.body.y + player.direction.y * (player.speed * speedModifier) * dt;

    if (player.body.x >= x && player.direction.x > 0
      || player.body.x <= x && player.direction.x < 0
      || player.body.y >= y && player.direction.y > 0
      || player.body.y <= y && player.direction.y < 0) {
      player.direction.x = 0;
      player.position.x = x;
      player.body.x = x;

      player.direction.y = 0;
      player.position.y = y;
      player.body.y = y;
    }
  } else {
    player.direction.x = 0;
    player.direction.y = 0;
  }
}

export function initPlayer(player: Player, mapData: MapData, gameSprites: SpriteSheet): void {
  player.sprite = {
    spriteSheet: gameSprites,
    position: { x: 4, y: 1 }
  };

  player.position.x = mapData.spawnPosition.x;
  player.position.y = mapData.spawnPosition.y;

  player.body.x = player.position.x;
  player.body.y = player.position.y;
}
