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
  sprite: Sprite;
  color: string;
};

export type TileMap = {
  tileMapDataId: number;
  visible: boolean;
  visibleBySun: boolean;
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
  startGroundPosition: Vector2;
  startWallPosition: Vector2;

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
  SOUTH_EAST,
  NORTH_WEST,
  SOUTH_WEST,
};

export const normalizedDirection: Record<CompassEnum, Vector2> = {
  [CompassEnum.NORTH]: { x: 0, y: -1 },
  [CompassEnum.NORTH_EAST]: { x: -1, y: -1 },
  [CompassEnum.NORTH_WEST]: { x: 1, y: -1 },
  [CompassEnum.SOUTH]: { x: 0, y: 1 },
  [CompassEnum.SOUTH_EAST]: { x: -1, y: 1 },
  [CompassEnum.SOUTH_WEST]: { x: 1, y: 1 },
  [CompassEnum.WEST]: { x: -1, y: 0 },
  [CompassEnum.EAST]: { x: 1, y: 0 },
};

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

export type Message = {
  id: number;
  viewDistance: number;
  position: Vector2;
  talkedTimestamp: number;
  durationTimestamp: number;
  text: string;
};

export enum EntityEnum {
  PLAYER,
  GOBLIN,
  FIREPLACE,
  TORCH
};

export type Entity = {
  id: EntityEnum;
  isAlive: boolean;
  color: string;
  position: Vector2;
  direction: Vector2;
  body: Vector2;
  speed: number;
  facing: CompassEnum;
  viewDistance: number;
  memory: number;
  spawnTimestamp: number;
  sprite?: Sprite;
};

export type NpcEntity = Entity & {
  pathToFollow: Vector2[];
  memoryTimestamp: number | null;
  message: Message | null;
}

export type NpcStorage = Record<string, NpcEntity[]>;

export type ObjectStorage = Record<string, Entity[]>;

export type SpriteSheet = {
  sprites: HTMLImageElement;
  tileSize: number;
};

export type Sprite = {
  spriteSheet: SpriteSheet;
  position: Vector2;
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

export type WorldTime = {
  time: number;
  dayLength: number;
};

export type AmbientLighting = {
  value: number;
  modifier: boolean;
}

export type RGBColor = {
  r: number;
  g: number;
  b: number;
}

export type DayTimeColor = {
  time: number;
  color: RGBColor;
}
