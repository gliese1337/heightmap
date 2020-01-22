import Game from './Game';
import { GameMap } from  './GameMap';
import { Camera } from './Camera';
import Player from './Player';
import { defaultControlStates, keyMap, mouseMap } from './ControlConfig';

export default function main(canvas: HTMLCanvasElement, _: HTMLDivElement) {

  const camera = new Camera({
    horizon:  100, // horizon position (look up and down)
    distance: 1600,   // distance of map
    relief: 240,
    canvas: canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundcolor: 0xFFFFFFFF,
  });

  const player = new Player({
    x:    512, // x position on the map
    y:    800, // y position on the map
    z:    0,
    w:    150, // height of the camera
  });

  const map = new GameMap();
  const controls = { ...defaultControlStates };

  const game = new Game()
    .setInputMap(keyMap, mouseMap)
    .setUpdate((keys, mouse) => {
      controls.forwardbackward = (keys.mouse || keys.spc) ? (keys.sft ? -30 : 30) : 0;
      controls.leftright = (keys.lft ? 1 : 0) + (keys.rgt ? -1 : 0);
      controls.updown = (keys.up ? 2 : 0) + (keys.dwn ? -2 : 0);
      controls.lookupdwn = (keys.lup ? 5 : 0) + (keys.ldn ? -5 : 0);
      controls.mouse = keys.mouse;
      controls.mouseX = mouse.mouseX;
      controls.mouseY = mouse.mouseY;
    })
    .setLoop((seconds: number) => {
      player.update(controls, seconds, map);
      camera.update(controls, seconds);
      camera.render(player, map);
    })
    .resize(camera.screenwidth, camera.screenheight);

  window.addEventListener('resize', function() {
    camera.resize(window.innerWidth, window.innerHeight);
    game.resize(camera.screenwidth, camera.screenheight);
  }, false);

  map.load("C1W;D1").then(() => game.start());
}