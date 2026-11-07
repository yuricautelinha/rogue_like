// import { moveCamera } from "./camera.js";
// import { DEFAULT_PLAYER_MEMORY, MAP_TILES_HEIGHT, MAP_TILES_WIDTH, TILE_SIZE } from "./constants.js";
// import { setupKeyEvents } from "./controls.js";
// import { drawEntity } from "./entity.js";
// import { doMiniMap } from "./map.js";
// import { type MapData, type Camera, type SpriteSheet, type MapSprite, type RGE_Canvas, TileTypeEnum, type TileMap, type Entity, CompassEnum, EntityEnum, type DirectionKeyboardInput, directionToCompassMap, type TileMapData } from "./models.js";
// import { clearCanvas, loadCanvas, loadImage, rand, sleep } from "./utils.js";
//
// let PAUSED = false;
// let FINISHED = false;
//
// window.addEventListener("load", main);
//
// async function main() {
//   const rgeCanvas = loadCanvas("game");
//   const miniMap = loadCanvas("mini-map");
//   const { canvas, context } = rgeCanvas;
//
//   canvas.width = window.innerWidth;
//   canvas.height = window.innerHeight;
//
//   window.addEventListener("resize", () => {
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;
//   });
//
//   context.imageSmoothingEnabled = false;
//
//   const gameSprites: SpriteSheet = {
//     asset: loadImage("game-sprites"),
//     tileSize: 32,
//   };
//   const camera: Camera = {
//     position: { x: 0, y: 0 },
//     direction: { x: 0, y: 0 },
//     speed: 100,
//     freelook: false,
//   };
//
//   const mapSprite: MapSprite = {
//     spriteSheet: gameSprites,
//     tileTypeSpriteCount: 4,
//     startGroundPosition: {x: 1, y: 4},
//     startWallPosition: {x: 5, y: 4}
//   };
//
//   const player: Entity = {
//     type: EntityEnum.PLAYER,
//     isAlive: true,
//     viewDistance: 0,
//     color: "WHITE",
//     position: { x: 0, y: 0, },
//     body: { x: 0, y: 0, },
//     direction: { x: 0, y: 0, },
//     speed: 100,
//     facing: CompassEnum.NORTH,
//     memory: DEFAULT_PLAYER_MEMORY,
//     spawnTimestamp: Date.now()
//   };
//
//   player.sprite = {
//     position: { x: 4, y: 1 },
//     spriteSheet: gameSprites
//   };
//
//   miniMap.canvas.width = 200;
//
//   const mapData = generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapSprite);
//   const miniMapData: MapData = { ...mapData, tileSize: miniMap.canvas.width / MAP_TILES_WIDTH };
//   const directionalInputs: DirectionKeyboardInput[] = [];
//
//   miniMap.canvas.height = miniMapData.tileSize * MAP_TILES_HEIGHT;
//
//   generateMap(mapData, player);
//   setupKeyEvents(player, directionalInputs, []);
//
//   window.addEventListener("keydown", (event) => {
//     if (event.key === ' ') {
//       PAUSED = !PAUSED;
//     } else if (event.key === 'f') {
//       camera.freelook = !camera.freelook;
//     }
//   });
//
//   requestAnimationFrame(
//     gameLoop(
//       camera,
//       mapData,
//       miniMapData,
//       player,
//       directionalInputs,
//       rgeCanvas,
//       miniMap,
//       0
//     )
//   );
// };
//
// function gameLoop(
//   camera: Camera,
//   mapData: MapData,
//   miniMapData: MapData,
//   player: Entity,
//   directionalInputs: DirectionKeyboardInput[],
//   gameRgeCanvas: RGE_Canvas,
//   miniMapRgeCanvas: RGE_Canvas,
//   lastTime: number
// ) {
//   const { canvas, context } = gameRgeCanvas;
//
//   return function(time: number) {
//     requestAnimationFrame(
//       gameLoop(
//         camera,
//         mapData,
//         miniMapData,
//         player,
//         directionalInputs,
//         gameRgeCanvas,
//         miniMapRgeCanvas,
//         time
//       )
//     );
//
//     const dt = (time - lastTime) / 1000;
//
//     moveCamera(player, camera, mapData, directionalInputs, canvas, dt);
//
//     context.beginPath();
//
//     clearCanvas("#000", gameRgeCanvas);
//     drawMap(camera, mapData, gameRgeCanvas);
//     drawEntity(player, camera, mapData, context);
//
//     doMiniMap(player, miniMapData, miniMapRgeCanvas);
//
//     if (FINISHED) {
//       const message = "Finalizado";
//       const measureMessage = context.measureText(message);
//       context.font = "60px bold sans-serif";
//       context.fillStyle = "WHITE";
//       context.fillText(
//         message,
//         canvas.width / 2 - measureMessage.width / 2,
//         canvas.height / 2,
//       );
//     }
//
//     context.closePath();
//   }
// }
//
// async function generateMap(
//   mapData: MapData,
//   player: Entity,
// ): Promise<MapData> {
//   const { tilesData: tiles, map, width, height, mapSprite, spawnPosition } = mapData;
//   const coverage = 20 + rand(0, 15);
//
//   let n = (width * height) * (coverage * 0.03);
//   let x = 1 + rand(0, width - 2);
//   let y = 1 + rand(0, height - 2);
//
//   let dx = 0;
//   let dy = 0;
//   let straight = 0;
//
//   const tile = map[y]?.[x];
//
//   if (tile) {
//     tile.tileMapDataId = rand(0, mapSprite.tileTypeSpriteCount - 1);
//   }
//
//   while (n > 0) {
//     if (PAUSED) {
//       await sleep(1);
//       continue;
//     }
//
//     straight = Math.max(straight - 1, 0);
//
//     if (straight === 0) {
//       switch (rand(0, 4)) {
//         case (0):
//           dx = 0;
//           dy = -1;
//           break;
//         case (1):
//           dx = 0;
//           dy = 1;
//           break;
//         case (2):
//           dx = -1;
//           dy = 0;
//           break;
//         case (3):
//           dx = 1;
//           dy = 0;
//           break;
//         default:
//           straight = 4 + rand(0, 7);
//           break;
//       }
//     }
//
//     x = Math.min(Math.max(x + dx, 1), width - 2);
//     y = Math.min(Math.max(y + dy, 1), height - 2);
//
//     const tile = map[y]?.[x];
//
//     if (tile && tiles[tile.tileMapDataId]?.type === TileTypeEnum.WALL) {
//       tile.tileMapDataId = rand(0, mapSprite.tileTypeSpriteCount - 1);
//       n--;
//     }
//
//     player.position.x = x;
//     player.position.y = y;
//
//     player.body.x = x;
//     player.body.y = y;
//
//
//     player.facing = directionToCompassMap[`(${dx},${dy})`] ?? player.facing;
//
//     await sleep(10);
//   }
//
//   spawnPosition.x = x;
//   spawnPosition.y = y;
//
//   FINISHED = true;
//
//   return mapData;
// }
//
// function drawMap(
//   camera: Camera,
//   { map, mapSprite, tileSize, tilesData: tiles }: MapData,
//   { canvas, context }: RGE_Canvas,
// ): void {
//   const tilesX = Math.ceil(canvas.width / tileSize) + 1;
//   const tilesY = Math.ceil(canvas.height / tileSize) + 1;
//
//   const offsetX = camera.position.x % 1;
//   const offsetY = camera.position.y % 1;
//
//   const cx = Math.floor(camera.position.x);
//   const cy = Math.floor(camera.position.y);
//
//   for (let y = 0; y < tilesY; ++y) {
//     for (let x = 0; x < tilesX; ++x) {
//       const mapTile = map?.[y + cy]?.[x + cx] ?? wallTileMap(mapSprite);
//       const tileData = tiles[mapTile.tileMapDataId];
//
//       if (!tileData) {
//         continue;
//       }
//
//       context.drawImage(
//         mapSprite.spriteSheet.asset,
//         tileData.sprite.position.x * tileData.sprite.spriteSheet.tileSize,
//         tileData.sprite.position.y * tileData.sprite.spriteSheet.tileSize,
//         tileData.sprite.spriteSheet.tileSize,
//         tileData.sprite.spriteSheet.tileSize,
//         (x - offsetX) * tileSize,
//         (y - offsetY) * tileSize,
//         tileSize,
//         tileSize
//       );
//     }
//   }
// }
//
// export function generateMapData(
//   tileSize: number,
//   width: number,
//   height: number,
//   mapSprite: MapSprite,
// ): MapData {
//   const map: TileMap[][] =
//     new Array(height).fill(0).map(() =>
//       new Array(width)
//         .fill(mapSprite.startWallPosition)
//         .map(() => wallTileMap(mapSprite))
//     );
//
//   const tiles: TileMapData[] = new Array(mapSprite.tileTypeSpriteCount)
//     .fill(null)
//     .map((_, index: number): TileMapData => groundTileMapData(index, mapSprite))
//     .concat(
//       new Array(mapSprite.tileTypeSpriteCount)
//         .fill(null)
//         .map((_, index: number): TileMapData => wallTileMapData(index, mapSprite))
//     );
//
//   return {
//     width,
//     height,
//     map,
//     tilesData: tiles,
//     tileSize,
//     mapSprite,
//     spawnPosition: { x: 0, y: 0 }
//   };
// }
//
// const wallTileMapData = (
//   index: number,
//   mapSprite: MapSprite
// ): TileMapData => ({
//   id: index,
//   type: TileTypeEnum.WALL,
//   sprite: {
//     spriteSheet: mapSprite.spriteSheet,
//     position: { x: index + mapSprite.startWallPosition.x, y: mapSprite.startWallPosition.y }
//   },
//   color: "#202020"
// });
//
// const groundTileMapData = (
//   index: number,
//   mapSprite: MapSprite
// ): TileMapData => ({
//   id: index,
//   type: TileTypeEnum.GROUND,
//   sprite: {
//     spriteSheet: mapSprite.spriteSheet,
//     position: { x: index + mapSprite.startGroundPosition.x, y: mapSprite.startGroundPosition.y }
//   },
//   color: "GREEN"
// });
//
//
// const wallTileMap = (mapSprite: MapSprite): TileMap => ({
//   tileMapDataId: rand(mapSprite.startWallPosition.x, mapSprite.startWallPosition.x + mapSprite.tileTypeSpriteCount - 2),
//   revelead: false,
//   visible: false,
//   visibleBySun: false,
//   reveleadTimestamp: null,
// });
