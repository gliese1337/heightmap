import { ControlStates } from './ConcreteControls';
import { ScreenBuffer } from './ScreenBuffer';
import { GameMap } from './GameMap';

export interface CameraOpts {
  x:        number, // x position on the map
  y:        number, // y position on the map
  height:   number, // height of the camera
  angle:    number, // direction of the camera
  horizon:  number, // horizon position (look up and down)
  distance: number, // distance of map
  relief:   number, // vertical scale
}

function blend(c1: number, c2: number, r: number) {
  const s = 1 - r;
  return 0xff000000 | (
          (((((c1>>>16)&0xff)*s) << 16)|((((c1>>>8)&0xff)*s) << 8)|((c1&0xff)*s)) +
          (((((c2>>>16)&0xff)*r) << 16)|((((c2>>>8)&0xff)*r) << 8)|((c2&0xff)*r))
  );
}

export class Camera {
  private x:        number;
  private y:        number;
  private height:   number;
  private horizon:  number;
  private distance: number;
  private relief:   number;
  private angle:    number;
  public sin:       number;
  public cos:       number;

  constructor(opts: CameraOpts) {
    this.x = opts.x;
    this.y = opts.y;
    this.height = opts.height;
    this.horizon = opts.horizon;
    this.distance = opts.distance;
    this.relief = opts.relief;
    this.angle = opts.angle;
    this.sin = Math.sin(this.angle);
    this.cos = Math.cos(this.angle);
  }

  update(input: ControlStates, map: GameMap, time: number) {

    if (input.mouse) {
      this.height += input.mouseY * time * 30;
      this.angle += input.mouseX * time;
      this.sin = Math.sin(this.angle);
      this.cos = Math.cos(this.angle);
    } else {
      if (input.leftright !== 0) {
        this.angle += input.leftright*time;
        this.sin = Math.sin(this.angle);
        this.cos = Math.cos(this.angle);
      }

      this.height += input.updown * time * 10;
    }

    if (input.forwardbackward !== 0) {
      this.x -= input.forwardbackward * this.sin * time * 10;
      this.y -= input.forwardbackward * this.cos * time * 10;
    }

    this.horizon += input.lookupdwn * time * 10;

    // Collision detection. Don't fly below the surface.
    const height = map.altitude(this.x, this.y) + 10;
    if (height > this.height) this.height = height;
  }

  render(screendata: ScreenBuffer, map: GameMap) {

    const { color, shift } = map;
    const { sin, cos, distance, relief, height, horizon, x, y } = this;
  
    const {
      width: screenwidth,
      height: screenheight,
      buf32, buf8, imagedata,
      backgroundcolor,
    } = screendata;
    buf32.fill(backgroundcolor);
  
    const scale = relief * screenwidth / 800;

    const mapwidthperiod = map.width - 1;
    const mapheightperiod = map.height - 1;
  
    // 90 degree field of view
    let dx = -cos - sin;
    let dy = sin - cos;
    const d2x =  2 * cos / screenwidth;
    const d2y = -2 * sin / screenwidth;
    const d2 = distance * distance;
  
    for(let i=0; i<screenwidth; i++) {
      const dr = Math.hypot(dx, dy);
      let pr = dr;
      let px = x;
      let py = y;
      let hiddeny = screenheight;
  
      for(let z = 1; pr < distance; z++) {
        pr += dr;
        px += dx;
        py += dy;
  
        // Extract color and height, and calculate the top pixel position for the column
        const c = color[((py & mapwidthperiod) << shift) + (px & mapheightperiod)];
        const ytop = ((height - (c >>> 24)) * scale / z + horizon)|0; // |0 is equivalent to Math.floor
  
        if (ytop >= hiddeny) continue; // this column is fully occluded
  
        // get offset on screen for the vertical line
        let offset = ytop * screenwidth + i;
  
        // calculate final color, with distance fade
        const m = blend(c, backgroundcolor, pr*pr/d2);
  
        do {
          buf32[offset] = m;
          offset += screenwidth;
        } while (--hiddeny > ytop);
      }
  
      dx += d2x;
      dy += d2y;
    }


    // Show the back buffer on screen
    imagedata.data.set(buf8);
    screendata.context.putImageData(imagedata, 0, 0);
  }
}