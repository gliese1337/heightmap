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

function init_cast(point: [number, number, number], vector: [number, number, number]) {
  const [xc, yc, zc] = vector;
  const [x, y, z] = point;

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
  private x:        number;
  private y:        number;
  private altitude:   number;
  private horizon:  number;
  private range: number;
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

  private sines: Float32Array;
  private cosines: Float32Array;
  private fov: number;

  constructor(opts: CameraOpts) {
    this.x = opts.x;
    this.y = opts.y;
    this.altitude = opts.altitude;
    this.horizon = opts.horizon;
    this.range = opts.distance;
    this.relief = opts.relief;
    this.angle = opts.angle;
    this.sin = Math.sin(this.angle);
    this.cos = Math.cos(this.angle);

    this.fov = Math.PI/2;

    this.backgroundcolor = opts.backgroundcolor;

    this.canvas = opts.canvas;
    this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.resize(opts.width, opts.height);
  }

  setFoV(fov: number) {	
    const scale = Math.tan(fov/2);
    const { canvas: { width }, sines, cosines } = this;
    for (let col = 0; col < width; col++) {
      const angle = Math.atan(scale*(col / width - 0.5));
      const cos = Math.cos(angle);
      sines[col] = Math.sin(angle);
      cosines[col] = cos;
    }
  }
  
  resize(width: number, height: number) {
    this.screenwidth = width;
    this.screenheight = height;
    
    const { canvas } = this;
    canvas.width = width;
    canvas.height = height;
    this.sines = new Float32Array(width);
    this.cosines  = new Float32Array(width);
    this.setFoV(this.fov);

    this.imagedata = this.context.createImageData(width, height);
  
    const bufarray = new ArrayBuffer(width * height * 4);
    this.buf8   = new Uint8Array(bufarray);
    this.buf32  = new Uint32Array(bufarray);
  }

  update(input: ControlStates, map: GameMap, time: number) {
    if (input.mouse) {
      this.altitude += input.mouseY * time * 30;
      this.angle -= input.mouseX * time;
      this.sin = Math.sin(this.angle);
      this.cos = Math.cos(this.angle);
    } else {
      if (input.leftright !== 0) {
        this.angle -= input.leftright*time;
        this.sin = Math.sin(this.angle);
        this.cos = Math.cos(this.angle);
      }

      this.altitude += input.updown * time * 10;
    }

    if (input.forwardbackward !== 0) {
      this.x += input.forwardbackward * this.cos * time * 10;
      this.y += input.forwardbackward * this.sin * time * 10;
    }

    this.horizon += input.lookupdwn * time * 10;

    // Collision detection. Don't fly below the surface.
    this.altitude = Math.max(this.altitude, map.altitude(this.x, this.y) + 10);
  }

  render(map: GameMap) {
    const { color, shift } = map;
    const {
      x, y, sin, cos,
      sines, cosines,
      range, relief,
      altitude, horizon,
      backgroundcolor,
      screenwidth,
      screenheight,
      buf32, buf8, imagedata,
    } = this;
    buf32.fill(backgroundcolor);
  
    const scale = relief * screenwidth / 300;

    const r2 = range * range;

    for (let col = screenwidth-1; col >= 0; col--) {
      let hiddeny = screenheight;
			const rsin = sines[col];
      const rcos = cosines[col];
      
      const wmask = map.width - 1;
      const hmask = map.height - 1;
  
      let {
        mx, my, mz,
        sx, sy, sz,
        xdist, ydist, zdist,
        xdelta, ydelta, zdelta,
      } = init_cast([x, y, 0], [cos*rcos-sin*rsin, sin*rcos+cos*rsin, 0]);
  
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