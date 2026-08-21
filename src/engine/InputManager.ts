export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
  boost: boolean;
}

export class InputManager {
  public state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    drift: false,
    boost: false
  };

  private keyMap: { [key: string]: keyof InputState } = {
    KeyW: 'forward',
    ArrowUp: 'forward',
    KeyS: 'backward',
    ArrowDown: 'backward',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
    Space: 'drift',
    ShiftLeft: 'boost',
    ShiftRight: 'boost'
  };

  constructor() {
    this.setupKeyboard();
    this.setupTouch();
  }

  private setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      const action = this.keyMap[e.code];
      if (action) {
        this.state[action] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      const action = this.keyMap[e.code];
      if (action) {
        this.state[action] = false;
      }
    });
  }

  private setupTouch() {
    const bindTouch = (id: string, action: keyof InputState) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const activate = (e: Event) => {
        e.preventDefault();
        this.state[action] = true;
      };
      const deactivate = (e: Event) => {
        e.preventDefault();
        this.state[action] = false;
      };

      btn.addEventListener('touchstart', activate, { passive: false });
      btn.addEventListener('touchend', deactivate, { passive: false });
      btn.addEventListener('touchcancel', deactivate, { passive: false });
      btn.addEventListener('mousedown', activate);
      btn.addEventListener('mouseup', deactivate);
      btn.addEventListener('mouseleave', deactivate);
    };

    bindTouch('btn-gas', 'forward');
    bindTouch('btn-brake', 'backward');
    bindTouch('btn-left', 'left');
    bindTouch('btn-right', 'right');
    bindTouch('btn-drift', 'drift');
    bindTouch('btn-boost', 'boost');
  }

  public reset() {
    this.state.forward = false;
    this.state.backward = false;
    this.state.left = false;
    this.state.right = false;
    this.state.drift = false;
    this.state.boost = false;
  }
}
