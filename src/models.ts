export type RGE_Canvas = {
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D
};

export type Vector2 = {
  x: number;
  y: number;
};

export type WorldTime = {
  time: number;
  dayLength: number;
};

export type AmbientLighting = {
  value: number;
  modifier: boolean;
};

export type SpriteSheet = {
  asset: HTMLImageElement;
  tileSize: number;
};

export type Sprite = {
  spriteSheet: SpriteSheet;
  current: number;
  positions: Vector2[];
};

export enum TileTypeEnum {
  GROUND,
  WALL
};

export type TileMapData = {
  id: number;
  type: TileTypeEnum;
  sprite: TileMapSprite;
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
  ambientLighting: AmbientLighting;
  timeColorPallete: MapTimeColorPallete[];
};

export type MapSprite = {
  spriteSheet: SpriteSheet;
  tileTypeSpriteCount: number;
  startGroundPosition: Vector2;
  startWallPosition: Vector2;
};

export type TileMapSprite = {
  spriteSheet: SpriteSheet;
  position: Vector2;
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

export enum EntityEnum {
  PLAYER,
  CREATURE,
  OBJECT,
  STATIC_OBJEECT,
};

export type Entity = {
  id: number;
  type: EntityEnum;
  color: string;
  position: Vector2;
  spawnTimestamp: number;
  sprite: Sprite;
};

export type Memory = {
  duration: number;
  endTimestamp: number;
  canRemember: boolean;
};

export type HasMemory = {
  memory: Memory;
};

export type Eyes = HasMemory & {
  direction: Vector2;
  viewDistance: number;
};

export type HasEyes = {
  eyes: Eyes;
};

export type Health = {
  isAlive: boolean;
  value: number;
};

export type HasHealth = {
  health: Health;
};

export type Movment = {
  body: Vector2;
  speed: number;
  direction: Vector2;
};

export type CanMove = {
  movment: Movment;
};

export type PathToFollow = HasMemory & {
  positions: Vector2[];
};

export type CanFollow = {
  path: PathToFollow;
};

export type Light = HasMemory & {
  distance: number;
};

export type EmitsLight = {
  light: Light;
};

export type Message = HasMemory & {
  position: Vector2;
  text: string;
};

export type CanMessage = {
  message: Message | null;
};

export type PlayerEntity = Entity
  & HasEyes
  & HasHealth
  & CanMove
  & { type: EntityEnum.PLAYER };

export type CreatureEntity = Entity
  & HasEyes
  & HasHealth
  & CanMove
  & CanFollow
  & CanMessage
  & { type: EntityEnum.CREATURE };

export type FireplaceEntity = Entity
  & EmitsLight
  & { type: EntityEnum.STATIC_OBJEECT };

export type TorchEntity = Entity
  & EmitsLight
  & { type: EntityEnum.OBJECT };

export type EntityStorage<T extends Entity> = Record<string, T[]>;

export enum KeyboardInputTypeEnum {
  DIRECTIONAL,
  IDLE,
  RUN,
};

export type KeyboardInput = {
  id: string;
  type: KeyboardInputTypeEnum;
};

export type DirectionKeyboardInput = KeyboardInput & {
  type: KeyboardInputTypeEnum.DIRECTIONAL;
  direction: Vector2;
};

export type RGBColor = {
  r: number;
  g: number;
  b: number;
};

export type MapTimeColorPallete = {
  time: number;
  color: RGBColor;
};
