import GameLoop from './GameLoop';
import { GameMap } from  './GameMap';
import { ScreenBuffer } from './ScreenBuffer';
import { Camera } from './Camera';
import { Controls } from './Controls';

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
  const controls = new Controls(screen.width, screen.height);

  window.addEventListener('resize', function() {
    screen.resize(window.innerWidth, window.innerHeight);
    controls.resize(screen.width, screen.height);
  }, false);

  const loop = new GameLoop((seconds: number) => {
    camera.update(controls.states, map, seconds);
    console.time('render');
    camera.render(screen, map);
    console.timeEnd('render');
  });

  map.load("C1W;D1").then(() => loop.start());
}