import { OUTBOUNDED_INDEX } from "./constants.js";
import { type Entity, type Camera, type MapData, TileTypeEnum, type DirectionKeyboardInput, directionToCompassMap, type KeyboardInput, KeyboardInputTypeEnum, type SpriteSheet, CompassEnum, type NpcEntity, type NpcStorage, type Vector2 } from "./models.js";

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
    throw new Error("Player has no sprite");
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
    // context.font = "50px serif";
    // context.fillStyle = "RED";
    // context.fillText(entity.id.toString(), x, y);
  }
}

export function drawEntities(
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

      if (!mapTile?.visible) {
        return;
      }

      drawEntity(enemy, camera, mapData, context, debug);

      if (debug && enemy.isGoingTo !== undefined) {
        // context.font = "40px serif";
        // context.fillStyle = "WHITE";
        // context.fillText(
        //   `(${enemy.isGoingTo.x}, ${enemy.isGoingTo.y})`,
        //   (enemy.position.x - camera.position.x) * mapData.tileSize,
        //   (enemy.position.y + 1 - camera.position.y) * mapData.tileSize,
        // );
      }
    });
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
    entity.facing = directionToCompassMap[`(${entity.direction.x},${entity.direction.y})`] ?? entity.facing;
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

export function addEnemyBasedOnMousePosition(
  camera: Camera,
  mapData: MapData,
  enemies: NpcStorage,
  defaultPlayerSpeed: number,
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

    const storageKey = getNpcStorageKey(position);

    if (enemies[storageKey] !== undefined && enemies[storageKey]?.length > 0) {
      enemies[storageKey].splice(0, 1);
      return;
    }

    const mapTile = mapData.map?.[position.y]?.[position.x];

    if (mapData.tilesData[mapTile?.tileMapDataId ?? OUTBOUNDED_INDEX]?.type === TileTypeEnum.WALL) {
      return;
    }

    const generatedEnemies = new Array(count).fill(null).map((_, id) => {
      const enemy: NpcEntity = {
        id, // TODO: make ID dynamic
        isAlive: true,
        viewDistance: 4,
        color: "RED",
        position: { x: position.x, y: position.y },
        body: { x: position.x, y: position.y },
        direction: { x: 0, y: 0, },
        speed: defaultPlayerSpeed,
        facing: CompassEnum.SOUTH,
        memory: 5000,
        sprite: {
          spriteSheet: gameSprites,
          position: { x: 0, y: 1 }
        },
        isGoingTo: undefined,
        memoryDate: undefined
      };
      return enemy;
    });

    enemies[storageKey] = generatedEnemies;
  }
}

export const getNpcStorageKey = (position: Vector2) => `${position.x}${position.y}`;
