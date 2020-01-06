interface KeyValues {
  spc: boolean;
  sft: boolean;
  lft: boolean;
  rgt: boolean;
  up:  boolean;
  dwn: boolean;
  lup: boolean;
  ldn: boolean;
};

export interface ControlStates {
  forwardbackward: number,
  leftright:       number,
  updown:          number,
  lookupdwn:       number,
  mouseX:          number,
  mouseY:          number,
  mouse:           boolean,
}

function GetMousePosition(e: any) {
  return e.type.startsWith('touch') ?
    [e.targetTouches[0].pageX, e.targetTouches[0].pageY] :
    [e.pageX, e.pageY];
}

export default class Controls {
  private codes: { [key: number]: keyof KeyValues } = {
    32: 'spc', 16: 'sft',
    // left arrow, a 
    37: 'lft', 65: 'lft',
    // right arrow, d
    39: 'rgt', 68: 'rgt',
    // up arrow, w
    38: 'up', 87: 'up',
    // down arrow, s
    40: 'dwn', 83: 'dwn',
    82: 'lup', // r
    70: 'ldn', // f
  };

  private keys: KeyValues = {
    spc: false,
    sft: false,
    lft: false,
    rgt: false,
    up:  false,
    dwn: false,
    lup: false,
    ldn: false,
  };

  public states: ControlStates = {
    forwardbackward: 0,
    leftright:       0,
    updown:          0,
    lookupdwn:       0,
    mouseX:          0,
    mouseY:          0,
    mouse:           false,
  };

  public activated = false;

  constructor(private width: number, private height: number) {
    document.addEventListener('keydown', this.onKey.bind(this, true), false);
    document.addEventListener('keyup', this.onKey.bind(this, false), false);
    
    document.addEventListener('mousedown', this.onMouse.bind(this, 1), false);
    document.addEventListener('mousemove', this.onMouse.bind(this, 0), false);
    document.addEventListener('mouseup', this.onMouse.bind(this, -1), false);
    
    document.addEventListener('touchstart', this.onMouse.bind(this, 1), false);
    document.addEventListener('touchmove', this.onMouse.bind(this, 0), false);
    document.addEventListener('touchend', this.onMouse.bind(this, -1), false);
  }

  resize(w: number, h: number) {
    this.states.mouseX + (this.width - w) / 2;
    this.states.mouseY + (this.height - h) / 2;
    this.width = w;
    this.height = h;
  }

  onMouse(val: -1|0|1, e: MouseEvent) {
    const { button } = e;
    
    const { width, height, states, keys } = this;
    
    const [pageX, pageY] = GetMousePosition(e);
    states.mouseX = pageX - width / 2;
    states.mouseY = pageY - height / 2;

    if (button !== 0) {
      return;
    }

    if (val === 1) {
      states.forwardbackward = keys.sft ? -3 : 3;
      states.mouse = true;
      this.activated = true;
    } else if (val === -1) {
      states.forwardbackward = this.keys.spc ?
        (keys.sft ? -3 : 3) : 0;
      states.mouse = false;
    }
  }

  onKey(val: boolean, e: KeyboardEvent) {
    const key = this.codes[e.keyCode];
    if (typeof key === 'undefined') {
      return;
    }
    e.preventDefault && e.preventDefault();
    e.stopPropagation && e.stopPropagation();

    const keys = this.keys;
    if (keys[key] === val) return;
    keys[key] = val;

    if (!this.activated && val) {
      this.activated = true;
    }

    const states = this.states;
    if (keys.sft) {
      states.forwardbackward = (states.mouse || keys.spc) ? -3 : 0;
    } else {
      states.forwardbackward = (states.mouse || keys.spc) ? 3 : 0;
    }

    states.leftright = (keys.lft ? 1 : 0) + (keys.rgt ? -1 : 0);
    states.updown = (keys.up ? 2 : 0) + (keys.dwn ? -2 : 0);
    states.lookupdwn = (keys.lup ? 1 : 0) + (keys.ldn ? -1 : 0);
  }
}
