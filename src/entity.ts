import { DEFAULT_FIRE_DURATION, DEFAULT_PLAYER_MEMORY, DEFAULT_PLAYER_VIEW_DISTANCE, OUTBOUNDED_INDEX } from "./constants.js";
import { type Entity, type Camera, type MapData, TileTypeEnum, type DirectionKeyboardInput, directionToCompassMap, type KeyboardInput, KeyboardInputTypeEnum, type SpriteSheet, CompassEnum, type NpcEntity, type NpcStorage, type Vector2, type ObjectStorage, EntityEnum } from "./models.js";
import { normalizeVector2 } from "./utils.js";

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

  if (!entity.sprite) {
    throw new Error("Entity has no sprite");
  }

  context.drawImage(
    entity.sprite.spriteSheet.sprites,
    (entity.sprite.position.x + (entity.facing % 4)) * entity.sprite.spriteSheet.tileSize,
    entity.sprite.position.y * entity.sprite.spriteSheet.tileSize,
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
    context.fillText(entity.id.toString(), x, y);
  }
}

export function drawEntitiesFromNpcStorage(
  camera: Camera,
  mapData: MapData,
  player: Entity,
  entitiesStorage: NpcStorage,
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

      if (distanceFromPlayer > 20) {
        return;
      }

      const mapTile = mapData.map?.[enemy.position.y]?.[enemy.position.x];

      if (mapTile?.visible) {
        if (debug && enemy.pathToFollow.length > 0) {
          enemy.pathToFollow.forEach(path => {
            context.globalAlpha = .1;
            context.fillStyle = "CYAN";
            context.fillRect(
              (path.x - camera.position.x) * mapData.tileSize,
              (path.y - camera.position.y) * mapData.tileSize,
              mapData.tileSize,
              mapData.tileSize,
            );
            context.globalAlpha = 1;
          });
        }

        drawEntity(enemy, camera, mapData, context, debug);
      }

      if (enemy.message !== null) {
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
  objcetStorage: ObjectStorage,
  context: CanvasRenderingContext2D,
  debug = false
) {
  Object.values(objcetStorage).forEach(objects => {
    const object = objects[0];

    if (!object) {
      return;
    }

    const distanceFromPlayer = Math.abs(object.position.x - player.position.x) + Math.abs(object.position.y - player.position.y);

    if (distanceFromPlayer > 20) {
      return;
    }

    const mapTile = mapData.map?.[object.position.y]?.[object.position.x];

    if (!mapTile?.visible) {
      return;
    }

    drawEntity(object, camera, mapData, context, debug);
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
      entity.direction.x = entity.direction.x + inputDirection.direction.x;
      entity.direction.y = entity.direction.y + inputDirection.direction.y;

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

  let speedModifier = controlInputs.find(control => control.type === KeyboardInputTypeEnum.RUN) ? 1.6 : 1;

  if (tileData?.type === TileTypeEnum.GROUND) {
    const normalizedDirection = normalizeVector2(entity.direction);

    if (
      inputDirection
      && (entity.direction.x !== inputDirection.direction.x
        || entity.direction.y !== inputDirection?.direction.y)) {
      speedModifier = speedModifier - (speedModifier * .3);
    }

    entity.body.x = entity.body.x + normalizedDirection.x * (entity.speed * speedModifier) * dt;
    entity.body.y = entity.body.y + normalizedDirection.y * (entity.speed * speedModifier) * dt;

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

export function addEnemyBasedOnMousePosition(
  camera: Camera,
  mapData: MapData,
  enemies: NpcStorage,
  enemySpeed: number,
  gameSprites: SpriteSheet,
  count = 1,
  debug = false
) {
  return (event: MouseEvent) => {
    if (!debug) {
      return;
    }

    const position = {
      x: Math.floor(event.offsetX / mapData.tileSize + camera.position.x),
      y: Math.floor(event.offsetY / mapData.tileSize + camera.position.y),
    };

    const storageKey = getEntityStorageKey(position);

    if (enemies[storageKey] !== undefined && enemies[storageKey]?.length > 0) {
      enemies[storageKey].splice(0, 1);
      return;
    }

    const mapTile = mapData.map?.[position.y]?.[position.x];

    if (mapData.tilesData[mapTile?.tileMapDataId ?? OUTBOUNDED_INDEX]?.type === TileTypeEnum.WALL) {
      return;
    }

    const generatedEnemies = new Array(count).fill(null).map(() => {
      const enemy: NpcEntity = {
        id: EntityEnum.GOBLIN,
        isAlive: true,
        viewDistance: DEFAULT_PLAYER_VIEW_DISTANCE,
        color: "RED",
        position: { x: position.x, y: position.y },
        body: { x: position.x, y: position.y },
        direction: { x: 0, y: 0, },
        speed: enemySpeed,
        facing: CompassEnum.SOUTH,
        memory: DEFAULT_PLAYER_MEMORY,
        sprite: {
          spriteSheet: gameSprites,
          position: { x: 0, y: 1 }
        },
        pathToFollow: [],
        memoryTimestamp: null,
        message: null,
        spawnTimestamp: Date.now()
      };
      return enemy;
    });

    enemies[storageKey] = generatedEnemies;
  }
}

export function addObjectBasedOnMousePosition(
  camera: Camera,
  mapData: MapData,
  objects: ObjectStorage,
  gameSprites: SpriteSheet,
  debug = false
) {
  return (event: MouseEvent) => {
    const position = {
      x: Math.floor(event.offsetX / mapData.tileSize + camera.position.x),
      y: Math.floor(event.offsetY / mapData.tileSize + camera.position.y),
    };

    const storageKey = getEntityStorageKey(position);

    if (!debug && objects[storageKey] !== undefined && objects[storageKey]?.length > 0) {
      const obj = objects[storageKey][0];
      if (obj?.id === EntityEnum.FIREPLACE) {
        if (obj.isAlive) {
          obj.isAlive = false;
          obj.facing = CompassEnum.EAST;
        } else {
          obj.isAlive = true;
          obj.facing = CompassEnum.NORTH;
          obj.spawnTimestamp = Date.now();
        }
      }

      return;
    }


    if (objects[storageKey] !== undefined && objects[storageKey]?.length > 0) {
      objects[storageKey].splice(0, 1);
      return;
    }

    const mapTile = mapData.map?.[position.y]?.[position.x];

    if (mapData.tilesData[mapTile?.tileMapDataId ?? OUTBOUNDED_INDEX]?.type === TileTypeEnum.WALL) {
      return;
    }

    const object: Entity = {
      id: EntityEnum.FIREPLACE,
      isAlive: true,
      viewDistance: 5,
      color: "BLUE",
      position: { x: position.x, y: position.y },
      body: { x: position.x, y: position.y },
      direction: { x: 0, y: 0, },
      speed: 0,
      facing: CompassEnum.NORTH,
      memory: DEFAULT_FIRE_DURATION,
      sprite: {
        spriteSheet: gameSprites,
        position: { x: 0, y: 2 }
      },
      spawnTimestamp: Date.now()
    };

    objects[storageKey] = [object];
  }
}

export const getEntityStorageKey = (position: Vector2) => `${position.x}${position.y}`;
