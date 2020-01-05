"use strict";

// ---------------------------------------------
// Viewer information

const camera = {
  x:    512, // x position on the map
  y:    800, // y position on the map
  height:  150, // height of the camera
  angle:     0, // direction of the camera
  cos: 1,
  sin: 0,
  horizon:  100, // horizon position (look up and down)
  distance: 800,   // distance of map
  relief: 240,
};

// ---------------------------------------------
// Landscape data

const map = {
  width:  1024,
  height: 1024,
  shift:  10,  // power of two: 2^10 = 1024
  color:  new Uint32Array(1024*1024) // 1024 * 1024 int array with RGB colors and altitude in the high byte
};

// ---------------------------------------------
// Screen data

const screendata = {
  canvas:  null,
  context:   null,
  imagedata: null,

  bufarray:  null, // color data
  buf8:    null, // the same array but with bytes
  buf32:   null, // the same array but with 32-Bit words

  backgroundcolor: 0xFFFFFFFF
};

// ---------------------------------------------
// Keyboard and mouse interaction

const input = {
  forwardbackward: 0,
  leftright:     0,
  updown:      0,
  lookup:      false,
  lookdown:    false,
  mouseposition:   null,
  keypressed:    false
}

let updaterunning = false;

let time = new Date().getTime();

// for fps display
let timelastframe = new Date().getTime();
let frames = 0;

// ---------------------------------------------
// Draw the next frame

function Draw() {
  updaterunning = true;
  time = UpdateCamera(camera, input, map, time);
  // clear background
  screendata.buf32.fill(screendata.backgroundcolor);
  Render(screendata, camera, map);
  // Show the back buffer on screen
  screendata.imagedata.data.set(screendata.buf8);
  screendata.context.putImageData(screendata.imagedata, 0, 0);
  frames++;

  if (!input.keypressed) {
    updaterunning = false;
  } else {
    window.requestAnimationFrame(Draw, 0);
  }
}

// ---------------------------------------------
// Init routines

function OnResizeWindow() {
  const aspect = window.innerWidth / window.innerHeight;

  screendata.canvas.width = window.innerWidth<800?window.innerWidth:800;
  screendata.canvas.height = screendata.canvas.width / aspect;

  if (screendata.canvas.getContext) {
    screendata.context = screendata.canvas.getContext('2d');
    screendata.imagedata = screendata.context.createImageData(screendata.canvas.width, screendata.canvas.height);
  }

  screendata.bufarray = new ArrayBuffer(screendata.imagedata.width * screendata.imagedata.height * 4);
  screendata.buf8   = new Uint8Array(screendata.bufarray);
  screendata.buf32  = new Uint32Array(screendata.bufarray);
  Draw();
}

function Init() {
  screendata.canvas = document.getElementById('fullscreenCanvas');
  map.color.fill(0x00007050);

  LoadMap(map, "C1W;D1").then(Draw);
  OnResizeWindow();
  InitInput();

  window.onresize     = OnResizeWindow;

  window.setInterval(() => {
    const current = new Date().getTime();
    document.getElementById('fps').innerText = (frames / (current-timelastframe) * 1000).toFixed(1) + " fps";
    frames = 0;
    timelastframe = current;
  }, 100);
}

Init();