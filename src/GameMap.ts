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
}

