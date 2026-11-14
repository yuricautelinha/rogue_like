import { moveCamera } from "./camera.js";
import { DEFAULT_PLAYER_SPEED, DEFAULT_PLAYER_VIEW_DISTANCE, MAP_TILES_HEIGHT, MAP_TILES_WIDTH, TILE_SIZE } from "./constants.js";
import { setupKeyEvents } from "./controls.js";
import { drawMap, generateMap, generateMapData, placeHouseOnMap, updateMapWithoutFog } from "./map.js";
import { EntityEnum, type AmbientLighting, type Camera, type DirectionKeyboardInput, type House, type HouseData, type MapSprite, type MapTimeColorPallete, type PlayerEntity, type RGE_Canvas, type SpriteSheet, type Vector2 } from "./models.js";
import { clearCanvas, loadCanvas, loadImage, rand, randF } from "./utils.js";

window.addEventListener("load", main);

let index = 0;
const DEBUG = false;
async function main() {
  const rgeCanvas = loadCanvas("game");
  const { canvas, context } = rgeCanvas;

  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    context.imageSmoothingEnabled = false;
  });

  context.imageSmoothingEnabled = false;

  requestAnimationFrame(animate);

  const LEVEL_TO_RENDER = 10;
  const root: Node = {
    rectangle: {
      index,
      position: { x: 0, y: 0 },
      width: 256,
      height: 256,
    },
    depth: 0,
  };

  addNode(root, TILE_SIZE, 10);

  const gameSprites: SpriteSheet = {
    asset: loadImage("game-sprites"),
    tileSize: 32,
  };

  const player: PlayerEntity = {
    id: 0,
    type: EntityEnum.PLAYER,
    color: "WHITE",
    position: { x: 0, y: 0, },
    spawnTimestamp: Date.now(),
    sprite: {
      spriteSheet: gameSprites,
      current: 0,
      positions: [{ x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 }]
    },
    health: {
      isAlive: true,
      value: 1,
    },
    eyes: {
      viewDistance: DEFAULT_PLAYER_VIEW_DISTANCE,
      direction: { x: 0, y: -1 },
      memory: {
        canRemember: false,
        duration: 5000,
        endTimestamp: 0,
      }
    },
    movment: {
      body: { x: 0, y: 0, },
      direction: { x: 0, y: 0, },
      speed: DEFAULT_PLAYER_SPEED,
    },
  };



  const mapSprite: MapSprite = {
    spriteSheet: gameSprites,
    tileTypeSpriteCount: 4,
    startGroundPosition: { x: 1, y: 4 },
    startWallPosition: { x: 5, y: 4 },
    startWallIndex: 8,
  };

  const ambientLighting: AmbientLighting = {
    value: 1,
    modifier: true
  };

  const dayTimeColorPallette: MapTimeColorPallete[] = [
    { time: 0, color: { r: 0, g: 0, b: 0 } },
    { time: 0.40, color: { r: 0, g: 0, b: 0 } },
    //{ time: 0.5, r: 218, g: 120, b: 85 },
    { time: 0.5, color: { r: 210, g: 100, b: 61 } },
    { time: 0.6, color: { r: 210, g: 100, b: 61 } },
    //{ time: 0.7, r: 245, g: 183, b: 128 },
    { time: 0.7, color: { r: 119, g: 189, b: 233 } },
    { time: 0.75, color: { r: 81, g: 170, b: 231, } },
    { time: 0.8, color: { r: 23, g: 45, b: 80 } },
    { time: 1, color: { r: 0, g: 0, b: 0 } },
  ];

  const camera: Camera = {
    position: { x: 0, y: 0 },
    direction: { x: 0, y: 0 },
    speed: 100,
    freelook: true,
  };

  const houseData: HouseData = {
    bottom: {
      count: 5,
      startIndex: 14,
    },
    top: {
      count: 2,
      startIndex: 27,
    },
    leftBottom: {
      count: 1,
      startIndex: 12,
    },
    rightBottom: {
      count: 1,
      startIndex: 13,
    },
    left: {
      count: 2,
      startIndex: 23,
    },
    right: {
      count: 2,
      startIndex: 25,
    },
    leftTop: {
      count: 1,
      startIndex: 19,
    },
    rightTop: {
      count: 1,
      startIndex: 20,
    },
    leftCeil: {
      count: 4,
      startIndex: 21,
    },
    rightCeil: {
      count: 4,
      startIndex: 22,
    },
    floor: {
      count: 4,
      startIndex: 4,
    },
    door: {
      count: 1,
      startIndex: 29,
    },
  };


  const directionalInputs: DirectionKeyboardInput[] = [];
  setupKeyEvents(directionalInputs, []);
  const mapData = await generateMap(generateMapData(TILE_SIZE, MAP_TILES_WIDTH, MAP_TILES_HEIGHT, mapSprite, ambientLighting, dayTimeColorPallette));

  function placeHouses(node: Node) {
    if (node.depth !== LEVEL_TO_RENDER) {
      if (node.left) {
        placeHouses(node.left);
      }

      if (node.right) {
        placeHouses(node.right);
      }
      return;
    }

    const size = { x: Math.floor(node.rectangle.width) - 2, y: Math.floor(node.rectangle.height) - 2 };

    if (size.x < 5 || size.y < 5 || rand(0, 1000) < 300) {
      return;
    }

    const house: House = {
      doorPosition: { x: node.rectangle.position.x + 2, y: node.rectangle.position.y + size.y },
      position: { x: node.rectangle.position.x + 1, y: node.rectangle.position.y + 1 },
      size
    };

    placeHouseOnMap(mapData, houseData, house);
  }
  placeHouses(root);

  let lastTime = 0;
  function animate(time: number) {
    requestAnimationFrame(animate);

    const dt = (time - lastTime) / 1000;
    lastTime = time;

    moveCamera(player, camera, mapData, directionalInputs, canvas, dt);

    updateMapWithoutFog(mapData, camera, canvas);

    clearCanvas("BLACK", rgeCanvas);

    context.beginPath();
    drawMap(camera, mapData, rgeCanvas);

    //drawGrid(TILE_SIZE, camera, rgeCanvas);

    context.beginPath();
    context.strokeStyle = "RED";
    drawTree(camera, TILE_SIZE, rgeCanvas, root);
    context.stroke();
  }
}

type Rectangle = {
  index: number;
  position: Vector2;
  width: number;
  height: number;
};

type Node = {
  rectangle: Rectangle;
  left?: Node;
  right?: Node;
  depth: number;
};

function addNode(node: Node, tileSize: number, depth = 1) {
  if (depth === 0) {
    return;
  }

  const r = randF(0.4, 0.6);
  if (node.rectangle.width > node.rectangle.height) {
    const width = Math.floor(node.rectangle.width * r);

    node.left = {
      rectangle: {
        index: index + 1,
        position: { x: node.rectangle.position.x, y: node.rectangle.position.y },
        width,
        height: node.rectangle.height
      },
      depth: node.depth + 1
    };

    node.right = {
      rectangle: {
        index: index + 2,
        position: { x: node.rectangle.position.x + width, y: node.rectangle.position.y },
        width: Math.abs(node.rectangle.width - width),
        height: node.rectangle.height
      },
      depth: node.depth + 1
    }

    index += 2;
    addNode(node.left, tileSize, depth - 1);
    addNode(node.right, tileSize, depth - 1);
  } else {
    const height = Math.floor(node.rectangle.height * r);

    node.left = {
      rectangle: {
        index: index + 1,
        position: { x: node.rectangle.position.x, y: node.rectangle.position.y },
        width: node.rectangle.width,
        height
      },
      depth: node.depth + 1
    };

    node.right = {
      rectangle: {
        index: index + 2,
        position: { x: node.rectangle.position.x, y: node.rectangle.position.y + height },
        width: node.rectangle.width,
        height: Math.abs(node.rectangle.height - height)
      },
      depth: node.depth + 1
    }

    index += 2;
    addNode(node.left, tileSize, depth - 1);
    addNode(node.right, tileSize, depth - 1);
  }
}

export function drawTree(camera: Camera, tileSize: number, rgeCanvas: RGE_Canvas, node?: Node) {
  if (node === undefined) {
    return;
  }

  const { context } = rgeCanvas;

  context.strokeStyle = "RED";

  context.rect(
    (node.rectangle.position.x - camera.position.x) * tileSize,
    (node.rectangle.position.y - camera.position.y) * tileSize,
    node.rectangle.width * tileSize,
    node.rectangle.height * tileSize,
  );

  if (DEBUG) {
    context.font = "60px bold sans-serif";
    context.fillStyle = "RED";

    context.fillText(
      node.rectangle.index.toString(),
      (node.rectangle.position.x + node.rectangle.width / 2) * tileSize,
      (node.rectangle.position.y + node.rectangle.height / 2) * tileSize
    );
  }

  drawTree(camera, tileSize, rgeCanvas, node.left);
  drawTree(camera, tileSize, rgeCanvas, node.right);
}
