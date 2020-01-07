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

  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private imagedata: ImageData;
  private buf8: Uint8Array; // color data as bytes
  private buf32: Uint32Array; // the same array but with 32-Bit words

  public screenwidth: number;
  public screenheight: number;
  private backgroundcolor: number;

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

    this.backgroundcolor = opts.backgroundcolor;

    this.canvas = opts.canvas;
    this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.resize(opts.width, opts.height);
  }

  resize(width: number, height: number) {
    this.screenwidth = width;
    this.screenheight = height;
    
    const { canvas } = this;
    canvas.width = width;
    canvas.height = height;

    this.imagedata = this.context.createImageData(width, height);
  
    const bufarray = new ArrayBuffer(width * height * 4);
    this.buf8   = new Uint8Array(bufarray);
    this.buf32  = new Uint32Array(bufarray);
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
    this.altitude = Math.max(this.altitude, map.altitude(this.x, this.y) + 10);
  }

  render(map: GameMap) {
    const { color, shift } = map;
    const {
      x, y,
      sin, cos,
      distance, relief,
      altitude, horizon,
      backgroundcolor,
      screenwidth,
      screenheight,
      buf32, buf8, imagedata,
    } = this;
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

        // calculate final color, with distance fade
        const m = blend(c, backgroundcolor, pr*pr/d2);
  
        // get offset on screen for the vertical line
        let offset = ytop * screenwidth + i;

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
    this.context.putImageData(imagedata, 0, 0);
  }
}