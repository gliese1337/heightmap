import { noise } from './perlin';

function blend(c1: number, c2: number, r: number) {
  const s = 1 - r;
  return 0xff000000 | (
          (((((c1>>>16)&0xff)*s) << 16)|((((c1>>>8)&0xff)*s) << 8)|((c1&0xff)*s)) +
          (((((c2>>>16)&0xff)*r) << 16)|((((c2>>>8)&0xff)*r) << 8)|((c2&0xff)*r))
  );
}

export class GameMap {
  public readonly width = 1024;
  public readonly height = 1024;
  public readonly shift = 10;  // power of two: 2^10 = 1024
  private color = new Uint32Array(1024*1024) // 1024 * 1024 int array with RGB colors and altitude in the high byte

  constructor() {
    this.color.fill(0x00007050);
  }

  column(x: number, y: number, z: number) {
    const n = noise(x/100, y/100, z/100);
    const a = n * 255;
    const c = blend(0x0000FF, 0x00FF00, n);
    return [ a, c ];
  }
}

