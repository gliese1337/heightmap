import Game from './Game';
import { GameMap } from  './GameMap';
import { Camera } from './Camera';
import { defaultControlStates, keyMap, mouseMap } from './ControlConfig';

export default function main(canvas: HTMLCanvasElement, _: HTMLDivElement) {

  const camera = new Camera({
    x:    512, // x position on the map
    y:    800, // y position on the map
    altitude:  150, // height of the camera
    phi:     0, // direction of the camera (look left and right)
    theta:     0, // direction of the camera (look up and down)
    distance: 800,   // distance of map
    canvas: canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundcolor: 0xFFFFFFFF,
  });

  const map = new GameMap();
  const controls = { ...defaultControlStates };

  const game = new Game()
    .setInputMap(keyMap, mouseMap)
    .setUpdate((keys, mouse) => {
      controls.forwardbackward = (keys.mouse || keys.spc) ? (keys.sft ? -3 : 3) : 0;
      controls.leftright = (keys.lft ? 1 : 0) + (keys.rgt ? -1 : 0);
      controls.updown = (keys.up ? 2 : 0) + (keys.dwn ? -2 : 0);
      controls.lookupdwn = (keys.lup ? 5 : 0) + (keys.ldn ? -5 : 0);
      controls.mouse = keys.mouse;
      controls.mouseX = mouse.mouseX;
      controls.mouseY = mouse.mouseY;
    })
    .setLoop((seconds: number) => {
      camera.update(controls, map, seconds);
      camera.render(map);
    })
    .resize(camera.screenwidth, camera.screenheight);

  window.addEventListener('resize', function() {
    camera.resize(window.innerWidth, window.innerHeight);
    game.resize(camera.screenwidth, camera.screenheight);
  }, false);

  map.load("C1W;D1").then(() => game.start());
}