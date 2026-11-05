import { OUTBOUNDED_INDEX } from "./constants.js";
import { type Entity, type Camera, type MapData, TileTypeEnum, directionToCompassMap, type KeyboardInput, KeyboardInputTypeEnum, type Vector2, EntityTypeEnum, type EntityId, type Player, type EntityStorage, type SpatialIndex, type GameEntity, type BeignThatMoves, type FollowsAPath, type EmitsTextSentence, isEntityBeignThatMoves, CompassEnum } from "./models.js";
import { normalizeVector2 } from "./utils.js";

export function drawEntities(
  camera: Camera,
  mapData: MapData,
  entityStorage: EntityStorage,
  spatialIndex: SpatialIndex,
  context: CanvasRenderingContext2D,
  debug = false
) {
  const player = getPlayerEntity(entityStorage);

  spatialIndex.forEach(spatial => {
    if (spatial.size === 0) {
      return;
    }

    for (const entityId of spatial.values().take(2)) {
      const entity = entityStorage.get(entityId);

      if (entity === undefined) {
        break;
      }

      if (entity.id === player.id) {
        drawEntityThatMoves(camera, player, mapData.tileSize, context, debug);
        continue;
      }

      const distanceFromPlayer =
        Math.abs(entity.position.x - player.position.x) + Math.abs(entity.position.y - player.position.y);

      if (distanceFromPlayer > 20) {
        break;
      }

      const mapTile = mapData.map?.[entity.position.y]?.[entity.position.x];

      if (mapTile?.visible) {
        switch (entity.type) {
          case (EntityTypeEnum.GOBLIN):
            drawDebugEntityThatMoves(camera, entity, mapData.tileSize, context, debug);
            drawPathToFollow(camera, entity, mapData.tileSize, context, debug);
            drawEntityThatMoves(camera, entity, mapData.tileSize, context, debug);
            drawTextSentence(camera, entity, mapData.tileSize, context);
            break;
          default:
            drawEntityOn(camera, entity.position, mapData.tileSize, entity, context);
            break;
        }
      }
    }
  });
}

export function moveEntity(
  entity: Entity & BeignThatMoves,
  spatialIndex: SpatialIndex,
  mapData: MapData,
  controlInputs: KeyboardInput[],
  dt: number
) {
  const inputDirection = entity.directionalInputs[0];

  if (!entity.direction.x && !entity.direction.y) {
    if (inputDirection) {
      entity.direction.x = entity.direction.x + inputDirection.direction.x;
      entity.direction.y = entity.direction.y + inputDirection.direction.y;

    } else {
      return;
    }
  }

  if (inputDirection && entity.sprite) {
    const facing = directionToCompassMap[`(${inputDirection.direction.x},${inputDirection.direction.y})`] ?? CompassEnum.NORTH;
    entity.sprite.current = facing;
  }

  if (controlInputs.find(control => control.type === KeyboardInputTypeEnum.IDLE)
    && entity.position.x === entity.bodyPosition.x && entity.position.y === entity.bodyPosition.y) {
    entity.direction.x = 0;
    entity.direction.y = 0;
    return;
  }

  const x = entity.position.x + entity.direction.x;
  const y = entity.position.y + entity.direction.y;

  const mapTile = mapData.map?.[y]?.[x];
  const tileData = mapData.tilesData[mapTile?.tileMapDataId ?? OUTBOUNDED_INDEX];

  let speedModifier = controlInputs.find(control => control.type === KeyboardInputTypeEnum.RUN) ? 1.6 : 1;

  if (tileData?.type === TileTypeEnum.GROUND) {
    const normalizedDirection = normalizeVector2(entity.direction);

    if (
      inputDirection
      && (entity.direction.x !== inputDirection.direction.x
        || entity.direction.y !== inputDirection?.direction.y)) {
      speedModifier = speedModifier - (speedModifier * .3);
    }

    entity.bodyPosition.x = entity.bodyPosition.x + normalizedDirection.x * (entity.speed * speedModifier) * dt;
    entity.bodyPosition.y = entity.bodyPosition.y + normalizedDirection.y * (entity.speed * speedModifier) * dt;
    moveEntityOnSpatialIndex({ x, y }, entity, spatialIndex);

    if (entity.bodyPosition.x >= x && entity.direction.x > 0
      || entity.bodyPosition.x <= x && entity.direction.x < 0
      || entity.bodyPosition.y >= y && entity.direction.y > 0
      || entity.bodyPosition.y <= y && entity.direction.y < 0) {

      entity.direction.x = 0;
      entity.position.x = x;
      entity.bodyPosition.x = x;

      entity.direction.y = 0;
      entity.position.y = y;
      entity.bodyPosition.y = y;
    }
  } else {
    entity.direction.x = 0;
    entity.direction.y = 0;
  }
}

export function addEntityBasedOnMousePosition(
  camera: Camera,
  entityStorage: EntityStorage,
  spatialIndex: SpatialIndex,
  entity: GameEntity,
  mapData: MapData,
  count = 1,
  event: MouseEvent,
  debug = false
) {
  if (!debug) {
    return;
  }

  const position = {
    x: Math.floor(event.offsetX / mapData.tileSize + camera.position.x),
    y: Math.floor(event.offsetY / mapData.tileSize + camera.position.y),
  };

  entity.position.x = position.x;
  entity.position.y = position.y;

  if (isEntityBeignThatMoves(entity)) {
    entity.bodyPosition.x = entity.position.x;
    entity.bodyPosition.y = entity.position.y;
  }

  const player = getPlayerEntity(entityStorage);
  const set = getSpatialIndexSet(entity, spatialIndex);

  if (set && set.size > 0 && !set.has(player.id)) {
    set.clear();
    return;
  }

  const mapTile = mapData.map?.[position.y]?.[position.x];

  if (mapData.tilesData[mapTile?.tileMapDataId ?? OUTBOUNDED_INDEX]?.type === TileTypeEnum.WALL) {
    return;
  }

  new Array(count)
    .fill(null)
    .forEach(() => {
      addEntity({ ...entity }, spatialIndex, entityStorage)
    });
}





export const getEntitySpatialIndex =
  (position: Vector2) => `${position.x},${position.y}`;

export function addEntity(entity: GameEntity, spatialIndex: SpatialIndex, entityStorage: EntityStorage) {
  const index = getEntitySpatialIndex(entity.position);
  const positionSet = spatialIndex.get(index) ?? new Set();

  positionSet.add(entity.id);
  spatialIndex.set(index, positionSet);
  entityStorage.set(entity.id, entity);
}

export function moveEntityOnSpatialIndex(newPosition: Vector2, entity: Entity, spatialIndex: SpatialIndex) {
  const newIndex = getEntitySpatialIndex(newPosition);
  const currentSet = getSpatialIndexSet(entity, spatialIndex) ?? new Set();
  const nextSet = spatialIndex.get(newIndex) ?? new Set();

  currentSet.delete(entity.id);
  nextSet.add(entity.id);
  spatialIndex.set(newIndex, nextSet);
}

export function getSpatialIndexSet(entity: Entity, spatialIndex: SpatialIndex): Set<number> | undefined {
  const index = getEntitySpatialIndex(entity.position);
  return spatialIndex.get(index);
}

export function getSpatialIndexSetByPosition(position: Vector2, spatialIndex: SpatialIndex): Set<number> | undefined {
  const index = getEntitySpatialIndex(position);
  return spatialIndex.get(index);
}

export function getPlayerEntity(entityStorage: EntityStorage, entityId: EntityId = 0): Player {
  const entity = entityStorage.get(entityId);

  if (entity?.type !== EntityTypeEnum.PLAYER) {
    throw new Error(`Could not find player entity on storage`);
  }

  return entity;
}










function drawEntityThatMoves(
  camera: Camera,
  entity: Entity & BeignThatMoves,
  tileSize: number,
  context: CanvasRenderingContext2D,
  debug = false
): void {
  const x = (entity.bodyPosition.x - camera.position.x) * tileSize;
  const y = (entity.bodyPosition.y - camera.position.y) * tileSize;

  if (debug) {
  }

  drawEntityOn(camera, entity.bodyPosition, tileSize, entity, context);

  if (debug) {
    context.font = "20px serif";
    context.fillStyle = "RED";
    context.fillText(entity.id.toString(), x, y);
  }
}

function drawDebugEntityThatMoves(
  camera: Camera,
  entity: Entity & BeignThatMoves,
  tileSize: number,
  context: CanvasRenderingContext2D,
  debug = false
) {
  if (!debug) {
    return;
  }

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
    (entity.position.x + entity.direction.x - camera.position.x) * tileSize,
    (entity.position.y + entity.direction.y - camera.position.y) * tileSize,
    tileSize,
    tileSize
  );

  context.globalAlpha = 1;
}

function drawEntityOn(
  camera: Camera,
  position: Vector2,
  tileSize: number,
  entity: Entity,
  context: CanvasRenderingContext2D,
) {
  if (!entity.sprite) {
    throw new Error("Entity has no sprite");
  }

  const spritePosition = entity.sprite.positions[entity.sprite.current];

  if (!spritePosition) {
    throw new Error("Wrong entity sprite position");
  }

  context.drawImage(
    entity.sprite.spriteSheet.sprites,
    spritePosition.x * entity.sprite.spriteSheet.tileSize,
    spritePosition.y * entity.sprite.spriteSheet.tileSize,
    entity.sprite.spriteSheet.tileSize,
    entity.sprite.spriteSheet.tileSize,
    (position.x - camera.position.x) * tileSize,
    (position.y - camera.position.y) * tileSize,
    tileSize,
    tileSize,
  );
}

function drawPathToFollow(
  camera: Camera,
  entity: Entity & FollowsAPath,
  tileSize: number,
  context: CanvasRenderingContext2D,
  debug = false
) {
  if (!debug) {
    return;
  }

  context.globalAlpha = .5;
  entity.path.forEach(position => {
    context.globalAlpha = .1;
    context.fillStyle = "CYAN";
    context.fillRect(
      (position.x - camera.position.x) * tileSize,
      (position.y - camera.position.y) * tileSize,
      tileSize,
      tileSize,
    );
  });
  context.globalAlpha = 1;
}

function drawTextSentence(
  camera: Camera,
  entity: Entity & EmitsTextSentence,
  tileSize: number,
  context: CanvasRenderingContext2D,
) {
  if (entity.message === null) {
    return;
  }

  context.font = "25px serif";
  context.fillStyle = "ORANGE";
  context.fillText(
    entity.message.text,
    (entity.message.position.x - camera.position.x) * tileSize,
    (entity.message.position.y - camera.position.y) * tileSize,
  );
}
