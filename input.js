function GetMousePosition(e) {
  return e.type.startsWith('touch') ?
    [e.targetTouches[0].pageX, e.targetTouches[0].pageY] :
    [e.pageX, e.pageY];
}

function DetectMouseDown(e) {
  input.forwardbackward = 3;
  input.mouseposition = GetMousePosition(e);
  time = new Date().getTime();

  if (!updaterunning) Draw();
}

function DetectMouseUp() {
  input.mouseposition = null;
  input.forwardbackward = 0;
  input.leftright = 0;
  input.updown = 0;
}

function DetectMouseMove(e) {
  e.preventDefault();
  if (input.mouseposition == null) return;
  if (input.forwardbackward == 0) return;

  const currentMousePosition = GetMousePosition(e);

  input.leftright = (input.mouseposition[0] - currentMousePosition[0]) / window.innerWidth * 2;
  camera.horizon  = 100 + (input.mouseposition[1] - currentMousePosition[1]) / window.innerHeight * 500;
  input.updown  = (input.mouseposition[1] - currentMousePosition[1]) / window.innerHeight * 10;
}

function DetectKeysDown(e) {
  switch(e.keyCode) {
  case 37:  // left cursor
  case 65:  // a
    input.leftright = +1;
    break;
  case 39:  // right cursor
  case 68:  // d
    input.leftright = -1;
    break;
  case 38:  // cursor up
  case 87:  // w
    input.forwardbackward = 3;
    break;
  case 40:  // cursor down
  case 83:  // s
    input.forwardbackward = -3;
    break;
  case 82:  // r
    input.updown = +2;
    break;
  case 70:  // f
    input.updown = -2;
    break;
  case 69:  // e
    input.lookup = true;
    break;
  case 81:  //q
    input.lookdown = true;
    break;
  default:
    return;
  }

  if (!updaterunning) {
    time = new Date().getTime();
    Draw();
  }
}

function DetectKeysUp(e) {
  switch(e.keyCode) {
  case 37:  // left cursor
  case 65:  // a
    input.leftright = 0;
    break;
  case 39:  // right cursor
  case 68:  // d
    input.leftright = 0;
    break;
  case 38:  // cursor up
  case 87:  // w
    input.forwardbackward = 0;
    break;
  case 40:  // cursor down
  case 83:  // s
    input.forwardbackward = 0;
    break;
  case 82:  // r
    input.updown = 0;
    break;
  case 70:  // f
    input.updown = 0;
    break;
  case 69:  // e
    input.lookup = false;
    break;
  case 81:  //q
    input.lookdown = false;
    break;
  }
}

function InitInput() {
  window.onkeydown  = DetectKeysDown;
  window.onkeyup    = DetectKeysUp;
  window.onmousedown  = DetectMouseDown;
  window.onmouseup  = DetectMouseUp;
  window.onmousemove  = DetectMouseMove;
  window.ontouchstart = DetectMouseDown;
  window.ontouchend   = DetectMouseUp;
  window.ontouchmove  = DetectMouseMove;
}