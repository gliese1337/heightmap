export class ScreenBuffer {
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