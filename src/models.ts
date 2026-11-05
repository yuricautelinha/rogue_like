export type RGE_Canvas = {
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D
};

export type Vector2 = {
  x: number;
  y: number;
};

export enum TileTypeEnum {
  GROUND,
  WALL
};

export type TileMapData = {
  id: number;
  type: TileTypeEnum;
  spritePosition: Vector2,
  color: string;
};

export type TileMap = {
  tileMapDataId: number;
  visible: boolean;
  revelead: boolean;
  reveleadTimestamp: number | null;
};

export type MapData = {
  width: number;
  height: number;
  tileSize: number;
  map: TileMap[][];
  tilesData: TileMapData[];
  mapSprite: MapSprite;
  spawnPosition: Vector2;
};

export type MapSprite = {
  spriteSheet: SpriteSheet;
  tileTypeSpriteCount: number;
  groundOffset: number;
  wallOffset: number;
};

export type Camera = {
  position: Vector2;
  direction: Vector2;
  freelook: boolean;
  speed: number;
};

export enum CompassEnum {
  NORTH,
  EAST,
  SOUTH,
  WEST,
  NORTH_EAST,
  NORTH_WEST,
  SOUTH_EAST,
  SOUTH_WEST,
};

export const normalizedDirection: Record<CompassEnum, Vector2> = {
  [CompassEnum.NORTH]: { x: 0, y: -1 },
  [CompassEnum.NORTH_WEST]: { x: 1, y: -1 },
  [CompassEnum.WEST]: { x: -1, y: 0 },
  [CompassEnum.SOUTH_WEST]: { x: 1, y: 1 },
  [CompassEnum.SOUTH]: { x: 0, y: 1 },
  [CompassEnum.SOUTH_EAST]: { x: -1, y: 1 },
  [CompassEnum.EAST]: { x: 1, y: 0 },
  [CompassEnum.NORTH_EAST]: { x: -1, y: -1 },
};

export const compassArray: CompassEnum[] = [CompassEnum.EAST, CompassEnum.SOUTH, CompassEnum.NORTH, CompassEnum.WEST];

export const directionToCompassMap: Record<string, CompassEnum> = {
  [`(0,-1)`]: CompassEnum.NORTH,
  [`(0,1)`]: CompassEnum.SOUTH,
  [`(-1,0)`]: CompassEnum.WEST,
  [`(1,0)`]: CompassEnum.EAST,
  [`(1,-1)`]: CompassEnum.EAST,
  [`(-1,-1)`]: CompassEnum.WEST,
  [`(1,1)`]: CompassEnum.EAST,
  [`(-1,1)`]: CompassEnum.WEST,
};

export type SpriteSheet = {
  sprites: HTMLImageElement;
  tileSize: number;
};

export type Sprite = {
  spriteSheet: SpriteSheet;
  current: number;
  positions: Vector2[];
};

export enum KeyboardInputTypeEnum {
  DIRECTIONAL,
  IDLE,
  RUN,
};

export type KeyboardInput = {
  id: string;
  type: KeyboardInputTypeEnum;
}

export type DirectionKeyboardInput = KeyboardInput & {
  type: KeyboardInputTypeEnum.DIRECTIONAL;
  direction: Vector2;
};

export type TextSentence = {
  id: number;
  position: Vector2;
  talkedTimestamp: number;
  durationTimestamp: number;
  text: string;
};

export interface Memory {
  initialTimestamp: number;
  hasMemory: boolean;
}

export enum EntityTypeEnum {
  PLAYER,
  GOBLIN,
  FIREPLACE,
  TORCH
};

export type EntityId = number;

export interface Entity {
  id: EntityId;
  type: EntityTypeEnum;
  position: Vector2;
  facing: CompassEnum;
  color: string;
  sprite?: Sprite;
};

export interface LivingThing {
  isAlive: boolean;
}

export interface BeignThatMoves {
  bodyPosition: Vector2;
  direction: Vector2;
  speed: number;
  directionalInputs: DirectionKeyboardInput[];
}

export interface BeignThatSees {
  viewDistance: number;
}

export interface BeingThatMemorize {
  memoryDuration: number;
  memory: Memory;
}

export interface EmitsTextSentence {
  message: TextSentence | null;
}

export interface EmitsLight {
  intensity: number;
  duration: number;
  initialTimestamp: number;
}

export interface FollowsAPath {
  path: Vector2[];
}

export type Player =
  Entity
  & { type: EntityTypeEnum.PLAYER }
  & LivingThing
  & BeignThatMoves
  & BeingThatMemorize
  & BeignThatSees;

export type Goblin =
  Entity
  & { type: EntityTypeEnum.GOBLIN }
  & LivingThing
  & BeignThatMoves
  & BeingThatMemorize
  & EmitsTextSentence
  & FollowsAPath;

export type Fireplace =
  Entity
  & { type: EntityTypeEnum.FIREPLACE }
  & EmitsLight;

export type Torch =
  Entity
  & { type: EntityTypeEnum.TORCH }
  & BeignThatMoves
  & EmitsLight;

export type GameEntity = Player | Goblin | Fireplace | Torch

export type EntityStorage = Map<EntityId, GameEntity>;

export type SpatialIndex = Map<PositionKey, Set<EntityId>>

export type PositionKey = string;

export const isEntityBeignThatMoves = (entity: Entity): entity is Entity & BeignThatMoves =>
  entitiesThatMove.has(entity.type);

export const isEntityBeignThaFollowsAPath = (entity: Entity): entity is Entity & FollowsAPath =>
  entitiesThatFollowsAPath.has(entity.type);

export const isEntityThatEmitsTextSentence = (entity: Entity): entity is Entity & EmitsTextSentence =>
  entitiesThatEmitsTextSentence.has(entity.type);

const entitiesThatMove = new Set<EntityTypeEnum>([
  EntityTypeEnum.PLAYER,
  EntityTypeEnum.GOBLIN,
  EntityTypeEnum.TORCH
]);

const entitiesThatFollowsAPath = new Set<EntityTypeEnum>([
  EntityTypeEnum.GOBLIN
]);

const entitiesThatEmitsTextSentence = new Set<EntityTypeEnum>([
  EntityTypeEnum.GOBLIN
]);
