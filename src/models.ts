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
  revelead: boolean;
  reveleadDate?: number;
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
};

export enum CompassEnum {
  NORTH,
  EAST,
  SOUTH,
  WEST
};

export const normalizedDirection: Record<CompassEnum, Vector2> = {
  [CompassEnum.NORTH]: { x: 0, y: -1 },
  [CompassEnum.SOUTH]: { x: 0, y: 1 },
  [CompassEnum.WEST]: { x: -1, y: 0 },
  [CompassEnum.EAST]: { x: 1, y: 0 },
};

export const directionToCompassMap: Record<string, CompassEnum> = {
  [`(0,-1)`]: CompassEnum.NORTH,
  [`(0,1)`]: CompassEnum.SOUTH,
  [`(-1,0)`]: CompassEnum.WEST,
  [`(1,0)`]: CompassEnum.EAST,
};

export type Player = {
  id: number;
  color: string;
  position: Vector2;
  direction: Vector2;
  body: Vector2;
  speed: number;
  facing: CompassEnum;
  viewDistance: number;
  memory: number;
  sprite?: Sprite;
};

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
