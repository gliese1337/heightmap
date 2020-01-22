export interface Vec4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

export function vec_add(o: Vec4, dist: number, d: Vec4) {
  o.x += dist * d.x;
  o.y += dist * d.y;
  o.z += dist * d.z;
  o.w += dist * d.w;
}

//Destructively rotate a vector in the plane defined by itself and another vector
export function vec_rot(v: Vec4, k: Vec4, t: number) {
  const cos = Math.cos(t);
  const sin = Math.sin(t);

  v.x = v.x*cos + k.x*sin;
  v.y = v.y*cos + k.y*sin;
  v.z = v.z*cos + k.z*sin;
  v.w = v.w*cos + k.w*sin;
}

//Destructively rotate two vectors in the plane they define
export function vec_rot2(v: Vec4, k: Vec4, t: number) {
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  const { x, y, z, w } = v;

  v.x = x*cos + k.x*sin;
  v.y = y*cos + k.y*sin;
  v.z = z*cos + k.z*sin;
  v.w = w*cos + k.w*sin;

  k.x = k.x*cos - x*sin;
  k.y = k.y*cos - y*sin;
  k.z = k.z*cos - z*sin;
  k.w = k.w*cos - w*sin;
}

export function orthonorm(v: Vec4, ks: Vec4[]) {
  let { x: vx, y: vy, z: vz, w: vw } = v;

  for (const { x: kx, y: ky, z: kz, w: kw } of ks) {
    const vk = vx*kx+vy*ky+vz*kz+vw*kw;

    vx -= kx*vk;
    vy -= ky*vk;
    vz -= kz*vk;
    vw -= kw*vk;
  }

  const len = Math.sqrt(vx*vx+vy*vy+vz*vz+vw*vw);

  v.x = vx / len;
  v.y = vy / len;
  v.z = vz / len;
  v.w = vw / len;
}