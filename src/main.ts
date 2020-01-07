import GameLoop from './GameLoop';
import { GameMap } from  './GameMap';
import { ScreenBuffer } from './ScreenBuffer';
import { Camera } from './Camera';
import { Controls } from './Controls';
import { defaultControlStates, keyMap, mouseMap } from './ConcreteControls';


export default function main(canvas: HTMLCanvasElement, _: HTMLDivElement) {

  const camera = new Camera({
    x:    512, // x position on the map
    y:    800, // y position on the map
    height:  150, // height of the camera
    angle:     0, // direction of the camera
    horizon:  100, // horizon position (look up and down)
    distance: 800,   // distance of map
    relief: 240,
  });

  const map = new GameMap();
  const screen = new ScreenBuffer(canvas, window.innerWidth, window.innerHeight, 0xFFFFFFFF)
  const controls = new Controls(defaultControlStates);
  controls.resize(screen.width, screen.height);
  controls.setInputMap(keyMap, mouseMap);

  controls.setUpdate((states, keys, mouse) => {
    states.forwardbackward = (keys.mouse || keys.spc) ? (keys.sft ? -3 : 3) : 0;
    states.leftright = (keys.lft ? 1 : 0) + (keys.rgt ? -1 : 0);
    states.updown = (keys.up ? 2 : 0) + (keys.dwn ? -2 : 0);
    states.lookupdwn = (keys.lup ? 5 : 0) + (keys.ldn ? -5 : 0);
    states.mouse = keys.mouse;
    states.mouseX = mouse.mouseX;
    states.mouseY = mouse.mouseY;
  });

  window.addEventListener('resize', function() {
    screen.resize(window.innerWidth, window.innerHeight);
    controls.resize(screen.width, screen.height);
  }, false);

  const loop = new GameLoop((seconds: number) => {
    camera.update(controls.states, map, seconds);
    //console.time('render');
    camera.render(screen, map);
    //console.timeEnd('render');
  });

  map.load("C1W;D1").then(() => loop.start());
}