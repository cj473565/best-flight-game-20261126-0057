// Input for Sunset Isles: keyboard for flying, mouse for menus and
// for nudging the nose. Keys are tracked as a held set so the flight
// model can read them every frame; clicks are delivered as events.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let mouse = { x: 0, y: 0, down: false };
  const clickHandlers = [];

  const KEYMAP = {
    ArrowUp: 'throttleUp',
    KeyW: 'throttleUp',
    ArrowDown: 'throttleDown',
    KeyS: 'throttleDown',
    ArrowLeft: 'turnLeft',
    KeyA: 'turnLeft',
    ArrowRight: 'turnRight',
    KeyD: 'turnRight',
    KeyR: 'restart',
    KeyP: 'pause',
    Escape: 'pause',
    Enter: 'confirm',
    Space: 'confirm',
  };

  function onKeyDown(e) {
    const action = KEYMAP[e.code];
    if (action) {
      e.preventDefault();
      if (!keys.has(action)) pressed.add(action);
      keys.add(action);
    }
  }

  function onKeyUp(e) {
    const action = KEYMAP[e.code];
    if (action) keys.delete(action);
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top, down: mouse.down };
  }

  function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top, down: true };
    for (const fn of clickHandlers) fn(mouse.x, mouse.y);
  }

  function onMouseUp() {
    mouse = { x: mouse.x, y: mouse.y, down: false };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

  return {
    held(action) {
      return keys.has(action);
    },
    // True once, on the frame the key went down.
    tapped(action) {
      return pressed.has(action);
    },
    mouse() {
      return mouse;
    },
    onClick(fn) {
      clickHandlers.push(fn);
    },
    // Call at the end of every frame: one-shot presses clear.
    endFrame() {
      pressed.clear();
    },
  };
}
