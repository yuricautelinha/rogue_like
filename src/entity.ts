import { OUTBOUNDED_INDEX } from "./constants.js";
import { type Entity, type Camera, type MapData, TileTypeEnum, type DirectionKeyboardInput, directionToCompassMap, type KeyboardInput, KeyboardInputTypeEnum } from "./models.js";

export function drawEntity(
  entity: Entity,
  camera: Camera,
  { tileSize }: MapData,
  context: CanvasRenderingContext2D,
  debug = false
): void {
  const x = (entity.body.x - camera.position.x) * tileSize;
  const y = (entity.body.y - camera.position.y) * tileSize;

  if (debug) {
    context.fillStyle = entity.color;
    context.fillRect(
      (entity.position.x - camera.position.x) * tileSize,
      (entity.position.y - camera.position.y) * tileSize,
      tileSize,
      tileSize
    );

    context.fillStyle = "BLACK";
    context.fillRect(
      (entity.position.x + entity.direction.x - camera.position.x) * tileSize,
      (entity.position.y + entity.direction.y - camera.position.y) * tileSize,
      tileSize,
      tileSize
    );
  }

  if (!entity.sprite) {
    throw new Error("Player has no sprite");
  }

  if (debug) {
    context.globalAlpha = .5;
  }

  context.drawImage(
    entity.sprite.spriteSheet.sprites,
    (entity.sprite.position.x + entity.facing) * entity.sprite.spriteSheet.tileSize,
    entity.sprite.position.y * entity.sprite.spriteSheet.tileSize,
    entity.sprite.spriteSheet.tileSize,
    entity.sprite.spriteSheet.tileSize,
    x,
    y,
    tileSize,
    tileSize,
  );

  if (debug) {
    context.globalAlpha = 1;
  }
}

export function drawEntities(
  camera: Camera,
  mapData: MapData,
  entities: Entity[],
  context: CanvasRenderingContext2D,
  debug = false
) {
  entities.forEach(enemy => {
    const mapTile = mapData.map?.[enemy.position.y]?.[enemy.position.x];

    if (!mapTile?.visible) {
      return;
    }

    drawEntity(enemy, camera, mapData, context, debug);
  });
}

export function moveEntity(
  entity: Entity,
  mapData: MapData,
  directionalInputs: DirectionKeyboardInput[],
  controlInputs: KeyboardInput[],
  dt: number
) {
  const inputDirection = directionalInputs[0];

  if (!entity.direction.x && !entity.direction.y) {
    if (inputDirection) {
      entity.direction.x = inputDirection.direction.x;
      entity.direction.y = inputDirection.direction.y;
    } else {
      return;
    }
  }

  if (inputDirection) {
    entity.facing = directionToCompassMap[`(${inputDirection.direction.x},${inputDirection.direction.y})`] ?? entity.facing;
  }

  if (controlInputs.find(control => control.type === KeyboardInputTypeEnum.IDLE)
    && entity.position.x === entity.body.x && entity.position.y === entity.body.y) {
    entity.direction.x = 0;
    entity.direction.y = 0;
    return;
  }

  const x = entity.position.x + entity.direction.x;
  const y = entity.position.y + entity.direction.y;

  const mapTile = mapData.map?.[y]?.[x];
  const tileData = mapData.tilesData[mapTile?.tileMapDataId ?? OUTBOUNDED_INDEX];

  const speedModifier = controlInputs.find(control => control.type === KeyboardInputTypeEnum.RUN) ? 3 : 1;

  if (tileData?.type === TileTypeEnum.GROUND) {
    entity.body.x = entity.body.x + entity.direction.x * (entity.speed * speedModifier) * dt;
    entity.body.y = entity.body.y + entity.direction.y * (entity.speed * speedModifier) * dt;

    if (entity.body.x >= x && entity.direction.x > 0
      || entity.body.x <= x && entity.direction.x < 0
      || entity.body.y >= y && entity.direction.y > 0
      || entity.body.y <= y && entity.direction.y < 0) {
      entity.direction.x = 0;
      entity.position.x = x;
      entity.body.x = x;

      entity.direction.y = 0;
      entity.position.y = y;
      entity.body.y = y;
    }
  } else {
    entity.direction.x = 0;
    entity.direction.y = 0;
  }
}
