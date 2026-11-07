import { DEFAULT_PLAYER_VIEW_DISTANCE, OUTBOUNDED_INDEX } from "./constants.js";
import { type Entity, type Camera, type MapData, TileTypeEnum, type DirectionKeyboardInput, type KeyboardInput, KeyboardInputTypeEnum, type CreatureEntity, type EntityStorage, type Vector2, type CanMove, type PlayerEntity, type HasEyes, type SpriteSheet, type CanFollow } from "./models.js";
import { directionToSpritePosition, normalizeVector2 } from "./utils.js";

export function drawEntityCanMove(
  entity: Entity & CanMove,
  camera: Camera,
  tileSize: number,
  context: CanvasRenderingContext2D,
  debug = false
): void {
  if (debug) {
    context.globalAlpha = .5;
    context.fillStyle = entity.color;

    context.fillRect(
      (entity.position.x - camera.position.x) * tileSize,
      (entity.position.y - camera.position.y) * tileSize,
      tileSize,
      tileSize
    );

    context.fillStyle = "BLACK";
    context.fillRect(
      (entity.position.x + entity.movment.direction.x - camera.position.x) * tileSize,
      (entity.position.y + entity.movment.direction.y - camera.position.y) * tileSize,
      tileSize,
      tileSize
    );

    context.globalAlpha = 1;
  }
}

export function drawEntityOnPosition(
  camera: Camera,
  position: Vector2,
  entity: Entity,
  tileSize: number,
  context: CanvasRenderingContext2D,
  debug = false
) {
  const x = (position.x - camera.position.x) * tileSize;
  const y = (position.y - camera.position.y) * tileSize;

  const spritePosition = entity.sprite.positions[entity.sprite.current];

  if (!spritePosition) {
    throw new Error("Entity has no sprite");
  }

  context.drawImage(
    entity.sprite.spriteSheet.asset,
    spritePosition.x * entity.sprite.spriteSheet.tileSize,
    spritePosition.y * entity.sprite.spriteSheet.tileSize,
    entity.sprite.spriteSheet.tileSize,
    entity.sprite.spriteSheet.tileSize,
    x,
    y,
    tileSize,
    tileSize,
  );

  if (debug) {
    context.font = "20px serif";
    context.fillStyle = "RED";
    context.fillText(entity.type.toString(), x, y);
  }
}

export function drawEntityPathToFollow(
  camera: Camera,
  entity: Entity & CanFollow,
  tileSize: number,
  context: CanvasRenderingContext2D,
  debug = false
) {
  if (debug && entity.path.positions.length > 0) {
    entity.path.positions.forEach(path => {
      context.globalAlpha = .1;
      context.fillStyle = "CYAN";
      context.fillRect(
        (path.x - camera.position.x) * tileSize,
        (path.y - camera.position.y) * tileSize,
        tileSize,
        tileSize,
      );
      context.globalAlpha = 1;
    });
  }
}

export function drawEntitiesFromNpcStorage(
  camera: Camera,
  mapData: MapData,
  player: PlayerEntity,
  entitiesStorage: EntityStorage<CreatureEntity>,
  context: CanvasRenderingContext2D,
  debug = false
) {
  Object.values(entitiesStorage).forEach(enemies => {
    const enemy = enemies[0];

    if (!enemy) {
      return;
    }

    enemies.slice(0, 2).forEach(enemy => {
      const distanceFromPlayer = Math.abs(enemy.position.x - player.position.x) + Math.abs(enemy.position.y - player.position.y);

      if (distanceFromPlayer > 50) {
        return;
      }

      const mapTile = mapData.map?.[enemy.position.y]?.[enemy.position.x];

      if (mapTile?.visible) {
        drawEntityPathToFollow(camera, enemy, mapData.tileSize, context, debug);
        drawEntityOnPosition(camera, enemy.movment.body, enemy, mapData.tileSize, context, debug);
        drawEntityCanMove(enemy, camera, mapData.tileSize, context, debug);
      }

      if (enemy.message !== null && enemy.message.memory.canRemember) {
        context.font = "25px serif";
        context.fillStyle = "ORANGE";
        context.fillText(
          enemy.message.text,
          (enemy.message.position.x - camera.position.x) * mapData.tileSize,
          (enemy.message.position.y - camera.position.y) * mapData.tileSize,
        );
      }
    });
  });
}

export function drawEntitiesFromObjectStorage(
  camera: Camera,
  mapData: MapData,
  player: Entity,
  objcetStorage: EntityStorage<Entity>,
  context: CanvasRenderingContext2D,
  debug = false
) {
  Object.values(objcetStorage).forEach(objects => {
    const object = objects[0];

    if (!object) {
      return;
    }

    const distanceFromPlayer = Math.abs(object.position.x - player.position.x) + Math.abs(object.position.y - player.position.y);

    if (distanceFromPlayer > DEFAULT_PLAYER_VIEW_DISTANCE) {
      return;
    }

    const mapTile = mapData.map?.[Math.floor(object.position.y)]?.[Math.floor(object.position.x)];

    if (!mapTile?.visible) {
      return;
    }

    drawEntityOnPosition(camera, object.position, object, mapData.tileSize, context, debug);
  });
}

export function moveEntity(
  entity: Entity & HasEyes & CanMove,
  mapData: MapData,
  directionalInputs: DirectionKeyboardInput[],
  controlInputs: KeyboardInput[],
  dt: number
) {
  const inputDirection = directionalInputs[0];

  if (entity.movment.direction.x === 0 && entity.movment.direction.y === 0) {
    if (inputDirection) {
      entity.movment.direction.x = entity.movment.direction.x + inputDirection.direction.x;
      entity.movment.direction.y = entity.movment.direction.y + inputDirection.direction.y;

    } else {
      return;
    }
  }

  if (inputDirection) {
    entity.eyes.direction = { x: inputDirection.direction.x, y: inputDirection.direction.y };
    entity.sprite.current = directionToSpritePosition[`${entity.eyes.direction.x},${entity.eyes.direction.y}`] ?? 0;
  }

  if (controlInputs.find(control => control.type === KeyboardInputTypeEnum.IDLE)
    && entity.position.x === entity.movment.body.x && entity.position.y === entity.movment.body.y) {
    entity.movment.direction.x = 0;
    entity.movment.direction.y = 0;
    return;
  }

  const x = entity.position.x + entity.movment.direction.x;
  const y = entity.position.y + entity.movment.direction.y;

  const mapTile = mapData.map?.[y]?.[x];
  const tileData = mapData.tilesData[mapTile?.tileMapDataId ?? OUTBOUNDED_INDEX];

  let speedModifier = controlInputs.find(control => control.type === KeyboardInputTypeEnum.RUN) ? 1.6 : 1;

  if (tileData?.type === TileTypeEnum.GROUND) {
    const normalizedDirection = normalizeVector2(entity.movment.direction);

    if (
      inputDirection
      && (entity.movment.direction.x !== inputDirection.direction.x
        || entity.movment.direction.y !== inputDirection?.direction.y)) {
      speedModifier = speedModifier - (speedModifier * .3);
    }

    entity.movment.body.x = entity.movment.body.x + normalizedDirection.x * (entity.movment.speed * speedModifier) * dt;
    entity.movment.body.y = entity.movment.body.y + normalizedDirection.y * (entity.movment.speed * speedModifier) * dt;

    if (entity.movment.body.x >= x && entity.movment.direction.x > 0
      || entity.movment.body.x <= x && entity.movment.direction.x < 0
      || entity.movment.body.y >= y && entity.movment.direction.y > 0
      || entity.movment.body.y <= y && entity.movment.direction.y < 0) {
      entity.movment.direction.x = 0;
      entity.position.x = x;
      entity.movment.body.x = x;

      entity.movment.direction.y = 0;
      entity.position.y = y;
      entity.movment.body.y = y;
    }
  } else {
    entity.movment.direction.x = 0;
    entity.movment.direction.y = 0;
  }
}

export function addEntityBasedOnMousePosition<T extends Entity>(
  camera: Camera,
  mapData: MapData,
  entityStorage: EntityStorage<T>,
  entity: T,
  event: MouseEvent,
  count: number,
  spriteSheet: SpriteSheet
) {
  const position = {
    x: Math.floor(event.offsetX / mapData.tileSize + camera.position.x),
    y: Math.floor(event.offsetY / mapData.tileSize + camera.position.y),
  };

  const storageKey = getEntityStorageKey(position);

  if (entityStorage[storageKey] !== undefined && entityStorage[storageKey]?.length > 0) {
    entityStorage[storageKey].splice(0, 1);
    return;
  }

  const mapTile = mapData.map?.[position.y]?.[position.x];

  if (mapData.tilesData[mapTile?.tileMapDataId ?? OUTBOUNDED_INDEX]?.type === TileTypeEnum.WALL) {
    return;
  }

  const generatedEnemies = new Array(count).fill(null).map(() => {
    const newEntity = JSON.parse(JSON.stringify({ ...entity, position })) as T;
    newEntity.sprite.spriteSheet = spriteSheet;
    return newEntity;
  });

  entityStorage[storageKey] = generatedEnemies;
}

export const getEntityStorageKey = (position: Vector2) => `${position.x},${position.y}`;
