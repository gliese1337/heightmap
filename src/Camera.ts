import { ControlStates } from './ControlConfig';
import { GameMap } from './GameMap';

export interface CameraOpts {
  x:        number, // x position on the map
  y:        number, // y position on the map
  altitude:   number, // height of the camera
  phi:      number, // direction of the camera
  theta:    number, // direction of the camera
  distance: number, // distance of map
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
  private distance: number;
  private phi: number;
  private theta: number;

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
    this.distance = opts.distance;
    this.phi = opts.phi;
    this.theta = opts.theta;

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
      this.phi += input.mouseX * time;
    } else {
      if (input.leftright !== 0) {
        this.phi += input.leftright*time;
      }

      this.altitude += input.updown * time * 10;
    }

    if (input.forwardbackward !== 0) {
      this.x -= input.forwardbackward * Math.sin(this.phi) * time * 10;
      this.y -= input.forwardbackward * Math.cos(this.phi) * time * 10;
    }

    this.theta += input.lookupdwn * time;

    // Collision detection. Don't fly below the surface.
    this.altitude = Math.max(this.altitude, map.altitude(this.x, this.y) + 10);
  }

  render(map: GameMap) {
    const {
      x, y, phi, theta,
      distance: range,
      altitude,
      backgroundcolor,
      screenwidth,
      screenheight,
      buf32, buf8, imagedata,
    } = this;

    let offset = 0;
    for (let j = screenheight; j >= 0; j--) {
      const ytheta = theta + Math.atan2(j - screenheight/2, 20);
      for (let i = screenwidth; i >= 0; i--) {
        const xphi = phi + Math.atan2(i - screenwidth/2, 20);
        const { value, distance } = map.cast([x, y], altitude, xphi, ytheta, range);
        buf32[offset++] = blend(value, backgroundcolor, distance / range);
      }
    }

    // Show the back buffer on screen
    imagedata.data.set(buf8);
    this.context.putImageData(imagedata, 0, 0);
  }
}