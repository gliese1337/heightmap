import GameLoop from './GameLoop';
import Controls from './Controls';

export default function main(canvas: HTMLCanvasElement, fps: HTMLDivElement) {
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
  

  const input = new Controls(0, 0);

  function OnResizeWindow() {
    const aspect = window.innerWidth / window.innerHeight;
  
    screendata.canvas.width = window.innerWidth<800?window.innerWidth:800;
    screendata.canvas.height = screendata.canvas.width / aspect;
    input.resize(screendata.canvas.width, screendata.canvas.height);
  
    if (screendata.canvas.getContext) {
      screendata.context = screendata.canvas.getContext('2d');
      screendata.imagedata = screendata.context.createImageData(screendata.canvas.width, screendata.canvas.height);
    }
  
    screendata.bufarray = new ArrayBuffer(screendata.imagedata.width * screendata.imagedata.height * 4);
    screendata.buf8   = new Uint8Array(screendata.bufarray);
    screendata.buf32  = new Uint32Array(screendata.bufarray);
  }
  
  screendata.canvas = canvas;
  map.color.fill(0x00007050);

  OnResizeWindow();

  window.onresize     = OnResizeWindow;

  const loop = new GameLoop((seconds: number) => {
    UpdateCamera(camera, input, map, seconds);
    // clear background
    screendata.buf32.fill(screendata.backgroundcolor);
    Render(screendata, camera, map);
    // Show the back buffer on screen
    screendata.imagedata.data.set(screendata.buf8);
    screendata.context.putImageData(screendata.imagedata, 0, 0);
  });

  LoadMap(map, "C1W;D1").then(() => loop.start());
}