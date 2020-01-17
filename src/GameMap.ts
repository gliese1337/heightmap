export class GameMap {
  public readonly width = 1024;
  public readonly height = 1024;
  public readonly shift = 10;  // power of two: 2^10 = 1024
  public readonly color = new Uint32Array(1024*1024) // 1024 * 1024 int array with RGB colors and altitude in the high byte

  constructor() {
    this.color.fill(0x00007050);
  }

  async load(filenames: string) {
    const tempcanvas = document.createElement("canvas");
    const tempcontext = tempcanvas.getContext("2d") as CanvasRenderingContext2D;
    
    const data = filenames
      .split(";")
      .map(name => new Promise<Uint8ClampedArray>((resolve) => {
        const image = new Image();
        image.onload = () => {
          tempcanvas.width = this.width;
          tempcanvas.height = this.height;
          tempcontext.drawImage(image, 0, 0, this.width, this.height);
          resolve(tempcontext.getImageData(0, 0, this.width, this.height).data);
        };
        image.src = `maps/${name}.png`;
      }));

    const [ datac, datah ] = await Promise.all(data);

    const size = this.width*this.height;
    for (let i=0,j=0; i<size; i++, j+=4) {
      this.color[i] = (datah[j] << 24) | (datac[j + 2] << 16) | (datac[j + 1] << 8) | datac[j];
    }
  }

  altitude(x: number, y: number) {
    return this.color[((y & (this.width-1)) << this.shift) + (x & (this.height-1))]>>24;
  }

  cast([x, y]: [number, number], altitude: number, phi: number, theta: number, range: number) {
    const { width, height, shift } = this;
    const slope = Math.tan(theta);

    const cos = Math.cos(phi);
    const sin = Math.sin(phi);
    const tan = sin/cos;
    const cot = cos/sin;

    let xdelta = Math.abs(1/cos);
    let ydelta = Math.abs(1/sin);

    let d: number;
    let mx: number, sx: number;
    if(cos > 0){
      sx = 1;
      mx = Math.floor(x);
      d = mx + 1 - x;
    }else{
      sx = -1;
      mx = Math.ceil(x - 1);
      d = mx - x;
    }
    let xdist = Math.hypot(d, d * tan);

    let my: number, sy: number;
    if(sin > 0){
      sy = 1;
      my = Math.floor(y);
      d = my + 1 - y;
    }else{
      sy = -1;
      my = Math.ceil(y - 1);
      d = my - y;
    }
    let ydist = Math.hypot(d * cot, d);

    let distance = 0;
    let value = 0;
    let hit = false;
    do {
      if (xdist < ydist) {
        mx += sx;
        distance = xdist;
        xdist += xdelta;
      } else {
        my += sy;
        distance = ydist;
        ydist += ydelta;
      }

      value = this.color[((my & (width-1)) << shift) + (mx & (height-1))];
      hit = (value >> 24) >= (altitude + distance * slope);

    } while(!hit && distance < range);

    return { value, distance };
  }
}
