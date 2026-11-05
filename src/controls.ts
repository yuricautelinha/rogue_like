import { OUTBOUNDED_INDEX } from "./constants.js";
import { type DirectionKeyboardInput, CompassEnum, normalizedDirection, type KeyboardInput, KeyboardInputTypeEnum, type Player } from "./models.js";

const directionalKeyToCompassEnum: Record<string, CompassEnum> = {
  'ArrowUp': CompassEnum.NORTH,
  'ArrowRight': CompassEnum.EAST,
  'ArrowDown': CompassEnum.SOUTH,
  'ArrowLeft': CompassEnum.WEST,
  w: CompassEnum.NORTH,
  s: CompassEnum.SOUTH,
  a: CompassEnum.WEST,
  d: CompassEnum.EAST,
  q: CompassEnum.NORTH_EAST,
  e: CompassEnum.NORTH_WEST,
  z: CompassEnum.SOUTH_EAST,
  c: CompassEnum.SOUTH_WEST,
};

export function setupKeyEvents(
  player: Player,
  directionalInputs: DirectionKeyboardInput[],
  controlInputs: KeyboardInput[]
): void {
  window.addEventListener("blur", () => {
    directionalInputs.splice(0);
    controlInputs.splice(0);
  });

  let s = 0;

  window.addEventListener("keydown", (event) => {
    switch (event.key) {
      case ('ArrowUp'):
      case ('ArrowRight'):
      case ('ArrowDown'):
      case ('ArrowLeft'):
      case ('w'):
      case ('s'):
      case ('a'):
      case ('d'):
      case ('q'):
      case ('e'):
      case ('z'):
      case ('c'):
        const compassDirection = directionalKeyToCompassEnum[event.key];

        if (compassDirection === undefined) {
          throw new Error("No compass direction found.");
        }

        addDirectionKeyboardInput({
          id: event.key,
          type: KeyboardInputTypeEnum.DIRECTIONAL,
          direction: normalizedDirection[compassDirection]
        }, directionalInputs);
        break;
      case ('v'):
        addControlKeyboardInput({
          id: event.key,
          type: KeyboardInputTypeEnum.RUN,
        }, controlInputs);
        break;
      case ('b'):
        addControlKeyboardInput({
          id: event.key,
          type: KeyboardInputTypeEnum.IDLE,
        }, controlInputs);
        break;
      case ('g'):
        if (player.sprite) {
          switch ((s++) % 2) {
            case (0):
              player.sprite.positions = [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }];
              break;
            case (1):
              player.sprite.positions = [{ x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 }];
              break;
          };
        }
        break;
    }
  });

  window.addEventListener("keyup", (event) => {
    switch (event.key) {
      case ('ArrowUp'):
      case ('ArrowRight'):
      case ('ArrowDown'):
      case ('ArrowLeft'):
      case ('w'):
      case ('s'):
      case ('a'):
      case ('d'):
      case ('q'):
      case ('e'):
      case ('z'):
      case ('c'):
        const compassDirection = directionalKeyToCompassEnum[event.key];

        if (compassDirection === undefined) {
          throw new Error("No compass direction found.");
        }

        removeDirectionKeyboardInput({
          id: event.key,
          type: KeyboardInputTypeEnum.DIRECTIONAL,
          direction: normalizedDirection[compassDirection]
        }, directionalInputs);
        break;
      case ('b'):
        removeControlKeyboardInput({
          id: event.key,
          type: KeyboardInputTypeEnum.IDLE,
        }, controlInputs);
        break;
      case ('v'):
        removeControlKeyboardInput({
          id: event.key,
          type: KeyboardInputTypeEnum.RUN,
        }, controlInputs);
        break;
    }
  });
}

export function addDirectionKeyboardInput(
  input: DirectionKeyboardInput,
  inputs: DirectionKeyboardInput[]
) {
  const index = inputs.findIndex(playerInput => playerInput.id === input.id);

  if (index === OUTBOUNDED_INDEX) {
    inputs.push(input);
  }
}

export function removeDirectionKeyboardInput(
  input: DirectionKeyboardInput,
  inputs: DirectionKeyboardInput[]
) {
  const index = inputs.findIndex(playerInput => playerInput.id === input.id);

  if (index === OUTBOUNDED_INDEX) {
    throw new Error("No keyboard event to remove");
  }

  inputs.splice(index, 1);
}

export function addControlKeyboardInput(
  input: KeyboardInput,
  inputs: KeyboardInput[]
) {
  const index = inputs.findIndex(playerInput => playerInput.id === input.id);

  if (index === OUTBOUNDED_INDEX) {
    inputs.push(input);
  }
}

export function removeControlKeyboardInput(
  input: KeyboardInput,
  inputs: KeyboardInput[]
) {
  const index = inputs.findIndex(playerInput => playerInput.id === input.id);

  if (index === OUTBOUNDED_INDEX) {
    throw new Error("No keyboard event to remove");
  }

  inputs.splice(index, 1);
}
