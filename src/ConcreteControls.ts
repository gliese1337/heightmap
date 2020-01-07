
export interface ControlStates {
  forwardbackward: number,
  leftright:       number,
  updown:          number,
  lookupdwn:       number,
  mouseX:          number,
  mouseY:          number,
  mouse:           boolean,
}

export const defaultControlStates = {
  forwardbackward: 0,
  leftright:       0,
  updown:          0,
  lookupdwn:       0,
  mouseX:          0,
  mouseY:          0,
  mouse:           false,
} as ControlStates;

export const keyMap = {
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

export const mouseMap = {
  0: 'mouse',
  1: 'mouse',
  2: 'mouse',
};