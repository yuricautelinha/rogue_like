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

export type TileMap = {
  type: TileTypeEnum;
  sprite: Sprite;
  color: string;
};

export type MapData = {
  width: number;
  height: number;
  tileSize: number;
  map: TileTypeEnum[][];
  tiles: TileMap[];
  mapSprite: MapSprite;
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

export type Player = {
  id: number;
  color: string;
  position: Vector2;
  direction: Vector2;
  body: Vector2;
  speed: number;
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

export type DirectionKeyboardInput = {
  id: string;
  direction: Vector2;
};
