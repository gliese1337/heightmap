function GetMousePosition(e: any) {
  return e.type.startsWith('touch') ?
    [e.targetTouches[0].pageX, e.targetTouches[0].pageY] :
    [e.pageX, e.pageY];
}

interface InputCodes {
  [key: number]: string;
}

interface ReverseCodes {
  [key: string]: number[];
}

interface InputStates {
  [key: number]: boolean;
}

interface KeyValues {
  [key: string]: boolean;
}

interface MousePos {
  mouseX: number;
  mouseY: number;
};

type ControlUpdater<S> = (states: S, keys: KeyValues, mouse: MousePos) => void;

export class Controls<ControlStates extends {}> {
  public mouse: MousePos = { mouseX: 0, mouseY: 0};
  public keys: KeyValues = new Proxy({} as KeyValues, { get: (target, prop) => target[prop as string] || false });
  private keyCodes: InputCodes = {};
  private mouseCodes: InputCodes = {};
  private keyStates: InputStates = {};
  private mouseStates: InputStates = {};
  private reverseKey: ReverseCodes;
  private reverseMouse: ReverseCodes;
  private width = 0;
  private height = 0;
  private update: ControlUpdater<ControlStates> = () => {};

  constructor(public states: ControlStates) {

    document.addEventListener('keydown', this.onKey.bind(this, true), false);
    document.addEventListener('keyup', this.onKey.bind(this, false), false);
    
    document.addEventListener('mousedown', this.onMouse.bind(this, true), false);
    document.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    document.addEventListener('mouseup', this.onMouse.bind(this, false), false);
    
    document.addEventListener('touchstart', this.onMouse.bind(this, true), false);
    document.addEventListener('touchmove', this.onMouseMove.bind(this), false);
    document.addEventListener('touchend', this.onMouse.bind(this, false), false);
  }

  resize(w: number, h: number) {
    this.mouse.mouseX + (this.width - w) / 2;
    this.mouse.mouseY + (this.height - h) / 2;
    this.width = w;
    this.height = h;
  }

  setUpdate(update: ControlUpdater<ControlStates>) {
    this.update = update;
  }

  setInputMap(kc: InputCodes, mc: InputCodes) {
    const { keys } = this;
    let update = false;
    for (const k of Object.keys(keys)) {
      update = update || keys[k];
      keys[k] = false;
    }

    if (update) this.update(this.states, keys, this.mouse);

    this.keyCodes = kc;
    const rk: ReverseCodes = {};
    for (const [k,v] of Object.entries(kc)) {
      const l = rk[v]||[];
      l.push(+k);
      rk[v] = l;
    }
    this.reverseKey = rk;
    
    this.mouseCodes = mc;
    const rm: ReverseCodes = {};
    for (const [k,v] of Object.entries(mc)) {
      const l = rm[v]||[];
      l.push(+k);
      rm[v] = l;
    }
    this.reverseMouse = rm;

    for (const [keyCode, v] of Object.entries(this.keyStates)) {
      const key = this.keyCodes[+keyCode];
      if (typeof key === 'undefined') {
        continue;
      }
    
      if (v) keys[key] = true;
    }

    for (const [button, v] of Object.entries(this.mouseStates)) {
      const key = this.keyCodes[+button];
      if (typeof key === 'undefined') {
        continue;
      }
    
      if (v) keys[key] = true;
    }
  }

  private onMouse(val: boolean, e: Event) {
    const code = e instanceof MouseEvent ? e.button : 0;
    this.mouseStates[code] = val;
    const key = this.mouseCodes[code];
    if (typeof key === 'undefined') {
      return;
    }

    const { keys } = this;

    if (val) {
      if (keys[key]) return;
      keys[key] = true;
    } else {
      if (!keys[key]) return;
      const { mouseStates } = this;
      for (const code of this.reverseMouse[key]) {
        if(mouseStates[code]) return;
      }
      keys[key] = false;
    }

    this.update(this.states, keys, this.mouse);
  }

  private onMouseMove(e: Event) {
    const { width, height, mouse, keys } = this;
    const [pageX, pageY] = GetMousePosition(e);
    mouse.mouseX = 1 - 2 * pageX / width;
    mouse.mouseY = 1 - 2 * pageY / height;
    
    this.update(this.states, keys, mouse);
  }

  private onKey(val: boolean, e: KeyboardEvent) {
    const { keyCode } = e;
    this.keyStates[keyCode] = val;
    const key = this.keyCodes[keyCode];
    if (typeof key === 'undefined') {
      return;
    }
    e.preventDefault && e.preventDefault();
    e.stopPropagation && e.stopPropagation();
  
    const { keys } = this;

    if (val) {
      const keys = this.keys;
      if (keys[key]) return;
      keys[key] = true;
    } else {
      if (!keys[key]) return;
      const { keyStates } = this;
      for (const code of this.reverseKey[key]) {
        if(keyStates[code]) return;
      }
      keys[key] = false;
    }

    this.update(this.states, keys, this.mouse);
  }
}
