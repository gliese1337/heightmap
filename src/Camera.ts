import { ControlStates } from './ControlConfig';
import { GameMap } from './GameMap';

export interface CameraOpts {
  x:        number, // x position on the map
  y:        number, // y position on the map
  altitude:   number, // height of the camera
  angle:    number, // direction of the camera
  horizon:  number, // horizon position (look up and down)
  distance: number, // distance of map
  relief:   number, // vertical scale
  canvas: HTMLCanvasElement;
  height: number;
  width:  number;
  backgroundcolor: number;
}

function blend(c1: number, c2: number, r: number) {
  const s = 1 - r;
  return 0xff000000 | (
          (((((c1>>>16)&0xff)*s) << 16)|((((c1>>>8)&0xff)*s) << 8)|((c1&0xff)*s)) +
          (((((c2>>>16)&0xff)*r) << 16)|((((c2>>>8)&0xff)*r) << 8)|((c2&0xff)*r))
  );
}

class ScreenBuffer {
  public context: CanvasRenderingContext2D;
  public imagedata: ImageData;
  private bufarray: ArrayBuffer; // color data
  public buf8: Uint8Array; // the same array but with bytes
  public buf32: Uint32Array; // the same array but with 32-Bit words

  constructor(
    private canvas: HTMLCanvasElement,
    public height: number,
    public width: number,
    public backgroundcolor: number,
  ) {
    this.resize(height, width);
  }

  resize(width: number, height: number) {
    const { canvas } = this;
    this.width = canvas.width = width;
    this.height = canvas.height = height;

    this.context = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.imagedata = this.context.createImageData(width, height);
  
    this.bufarray = new ArrayBuffer(width * height * 4);
    this.buf8   = new Uint8Array(this.bufarray);
    this.buf32  = new Uint32Array(this.bufarray);
  }
};

export class Camera {
  private x:        number;
  private y:        number;
  private altitude:   number;
  private horizon:  number;
  private distance: number;
  private relief:   number;
  private angle:    number;
  private sin:       number;
  private cos:       number;

  private screenbuffer: ScreenBuffer;

  public width: number;
  public height: number;

  constructor(opts: CameraOpts) {
    this.x = opts.x;
    this.y = opts.y;
    this.altitude = opts.altitude;
    this.horizon = opts.horizon;
    this.distance = opts.distance;
    this.relief = opts.relief;
    this.angle = opts.angle;
    this.sin = Math.sin(this.angle);
    this.cos = Math.cos(this.angle);

    this.width = opts.width;
    this.height = opts.height;

    this.screenbuffer = new ScreenBuffer(opts.canvas, opts.width, opts.height, opts.backgroundcolor);
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.screenbuffer.resize(width, height);
  }

  update(input: ControlStates, map: GameMap, time: number) {

    if (input.mouse) {
      this.altitude += input.mouseY * time * 30;
      this.angle += input.mouseX * time;
      this.sin = Math.sin(this.angle);
      this.cos = Math.cos(this.angle);
    } else {
      if (input.leftright !== 0) {
        this.angle += input.leftright*time;
        this.sin = Math.sin(this.angle);
        this.cos = Math.cos(this.angle);
      }

      this.altitude += input.updown * time * 10;
    }

    if (input.forwardbackward !== 0) {
      this.x -= input.forwardbackward * this.sin * time * 10;
      this.y -= input.forwardbackward * this.cos * time * 10;
    }

    this.horizon += input.lookupdwn * time * 10;

    // Collision detection. Don't fly below the surface.
    const height = map.altitude(this.x, this.y) + 10;
    if (height > this.altitude) this.altitude = height;
  }

  render(map: GameMap) {

    const { color, shift } = map;
    const { sin, cos, distance, relief, altitude, horizon, x, y } = this;
  
    const {
      width: screenwidth,
      height: screenheight,
      buf32, buf8, imagedata,
      backgroundcolor,
    } = this.screenbuffer;
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
        const ytop = ((altitude - (c >>> 24)) * scale / z + horizon)|0; // |0 is equivalent to Math.floor
  
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
    this.screenbuffer.context.putImageData(imagedata, 0, 0);
  }
}