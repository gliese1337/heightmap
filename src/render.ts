function blend(c1: number, c2: number, r: number) {
  const s = 1 - r;
  return 0xff000000 | (
          (((((c1>>>16)&0xff)*s) << 16)|((((c1>>>8)&0xff)*s) << 8)|((c1&0xff)*s)) +
          (((((c2>>>16)&0xff)*r) << 16)|((((c2>>>8)&0xff)*r) << 8)|((c2&0xff)*r))
  );
}

export default function Render(screendata, camera, map) {
  const { color, shift } = map;
  const { sin, cos, distance, relief, height, horizon, x, y } = camera;

  const { width: screenwidth, height: screenheight } = screendata.canvas;
  const { buf32, backgroundcolor } = screendata;

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
      const ytop = ((height - (c >>> 24)) * relief / z + horizon)|0; // |0 is equivalent to Math.floor

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
}