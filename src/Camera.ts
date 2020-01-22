import { ControlStates } from './ControlConfig';
import { GameMap } from './GameMap';
import Player from './Player';
import { Vec3 } from './Vectors';

export interface CameraOpts {
  horizon: number, // horizon position (look up and down)
  distance: number, // distance of map
  relief: number, // vertical scale
  canvas: HTMLCanvasElement;
  height: number;
  width: number;
  backgroundcolor: number;
}

function blend(c1: number, c2: number, r: number) {
  const s = 1 - r;
  return 0xff000000 | (
          (((((c1>>>16)&0xff)*s) << 16)|((((c1>>>8)&0xff)*s) << 8)|((c1&0xff)*s)) +
          (((((c2>>>16)&0xff)*r) << 16)|((((c2>>>8)&0xff)*r) << 8)|((c2&0xff)*r))
  );
}

function init_comp(x: number, xc: number, yc: number, zc: number) {
  let s, m, d;
  if (xc > 0) {
    s = 1;
    m = Math.floor(x);
    d = m + 1 - x;
  } else {
    s = -1;
    m = Math.ceil(x - 1);
    d = m - x;
  }

  return { s, m, dist: Math.hypot(d, d * (yc/xc||0), d * (zc/xc||0)) };
}

function init_cast({ x, y, z }: Vec3, { x: xc, y: yc, z: zc }: Vec3) {
  let { s: sx, m: mx, dist: xdist } = init_comp(x, xc, yc, zc);
  let { s: sy, m: my, dist: ydist } = init_comp(y, yc, xc, zc);
  let { s: sz, m: mz, dist: zdist } = init_comp(z, zc, xc, yc);

  return {
    mx, my, mz,
    sx, sy, sz,
    xdist, ydist, zdist,
    xdelta: Math.abs(1/xc),
    ydelta: Math.abs(1/yc),
    zdelta: Math.abs(1/zc),
  };
}

export class Camera {
  private horizon: number;
  private range: number;
  private relief: number;
  private sines: Float64Array = null as any;
  private cosines: Float64Array = null as any;

  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private imagedata: ImageData;
  private buf8: Uint8Array; // color data as bytes
  private buf32: Uint32Array; // the same array but with 32-Bit words

  public screenwidth: number;
  public screenheight: number;
  private backgroundcolor: number;

  private fov: number;

  constructor(opts: CameraOpts) {
    this.horizon = opts.horizon;
    this.range = opts.distance;
    this.relief = opts.relief;

    this.fov = Math.PI/2;

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

    this.sines = new Float64Array(width);
    this.cosines = new Float64Array(width);
    for (let col = 0; col < width; col++) {
      const angle = this.fov * (col / width - 0.5);
      this.sines[col] = Math.sin(angle);
      this.cosines[col] = Math.cos(angle);
    }

    this.imagedata = this.context.createImageData(width, height);
  
    const bufarray = new ArrayBuffer(width * height * 4);
    this.buf8   = new Uint8Array(bufarray);
    this.buf32  = new Uint32Array(bufarray);
  }

  update(input: ControlStates, time: number) {
    this.horizon += input.lookupdwn * time * 10;
  }

  render(player: Player, map: GameMap) {
    const { color, shift } = map;
    const {
      range, relief, horizon,
      sines, cosines,
      backgroundcolor,
      screenwidth,
      screenheight,
      buf32, buf8, imagedata,
    } = this;
    buf32.fill(backgroundcolor);

    const { pos, fwd, rgt, altitude } = player;
  
    const scale = relief * screenwidth / 300;

    const r2 = range * range;

    for (let col = 0; col < screenwidth; col++) {
      let hiddeny = screenheight;
      const wmask = map.width - 1;
      const hmask = map.height - 1;
  
      /* calculate ray direction for this column */
      const sin = sines[col];
      const cos = cosines[col];
    
      const x = cos * fwd.x + sin * rgt.x;
      const y = cos * fwd.y + sin * rgt.y; 
      const z = cos * fwd.z + sin * rgt.z;
    
      const len = Math.hypot(x, y, z);
      const ray: Vec3 = { x: x / len, y: y / len, z: z / len };

      let {
        mx, my, mz,
        sx, sy, sz,
        xdist, ydist, zdist,
        xdelta, ydelta, zdelta,
      } = init_cast(pos, ray);
  
      let distance = 0;
      do {
        switch(Math.min(xdist, ydist, zdist)){
          case xdist:
            mx += sx;
            distance = xdist;
            xdist += xdelta;
            break;
          case ydist:
            my += sy;
            distance = ydist;
            ydist += ydelta;
            break;
          case zdist:
            mz += sz;
            distance = zdist;
            zdist += zdelta;
            break;
          default:
            debugger;
          }
  
        const value = color[((my & wmask) << shift) + (mx & hmask) + mz];

        // calculate the top pixel position for the column
        const ytop = ((altitude - (value >> 24)) * scale / distance + horizon)|0; // |0 is equivalent to Math.floor
        
        if (ytop < hiddeny) { // this column is not fully occluded
          // calculate final color, with distance fade
          const m = blend(value, backgroundcolor, distance*distance/r2);
          
          // get offset on screen for the vertical line
          let offset = ytop * screenwidth + col;

          do { // draw column section
            buf32[offset] = m;
            offset += screenwidth;
          } while (--hiddeny > ytop);
        }
      } while(distance < range);
    }

    // Show the back buffer on screen
    imagedata.data.set(buf8);
    this.context.putImageData(imagedata, 0, 0);
  }
}