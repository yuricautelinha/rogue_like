import { OUTBOUNDED_INDEX } from "./constants.js";
import { type DirectionKeyboardInput, CompassEnum, type Player, normalizedDirection, type KeyboardInput, KeyboardInputTypeEnum } from "./models.js";

const directionalKeyToCompassEnum: Record<string, CompassEnum> = {
  w: CompassEnum.NORTH,
  s: CompassEnum.SOUTH,
  a: CompassEnum.WEST,
  d: CompassEnum.EAST,
};

export function setupKeyEvents(
  player: Player,
  directionalInputs: DirectionKeyboardInput[],
  controlInputs: KeyboardInput[]
): void {
  let s = 0;

  window.addEventListener("blur", () => {
    directionalInputs.splice(0);
    controlInputs.splice(0);
  });

  window.addEventListener("keydown", (event) => {
    switch (event.key) {
      case ('w'):
      case ('s'):
      case ('a'):
      case ('d'):
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
              player.sprite.position.x = 0;
              player.sprite.position.y = 1;
              break;
            case (1):
              player.sprite.position.x = 4;
              player.sprite.position.y = 1;
              break;
          };
        }
        break;
    }
  });

  window.addEventListener("keyup", (event) => {
    switch (event.key) {
      case ('w'):
      case ('s'):
      case ('a'):
      case ('d'):
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
    inputs.unshift(input);
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
    inputs.unshift(input);
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
