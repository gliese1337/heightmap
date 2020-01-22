export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function vec_add(o: Vec3, dist: number, d: Vec3) {
  o.x += dist * d.x;
  o.y += dist * d.y;
  o.z += dist * d.z;
}

//Destructively rotate a vector in the plane defined by itself and another vector
export function vec_rot(v: Vec3, k: Vec3, t: number) {
  const cos = Math.cos(t);
  const sin = Math.sin(t);

  v.x = v.x*cos + k.x*sin;
  v.y = v.y*cos + k.y*sin;
  v.z = v.z*cos + k.z*sin;
}

//Destructively rotate two vectors in the plane they define
export function vec_rot2(v: Vec3, k: Vec3, t: number) {
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  const { x, y, z } = v;

  v.x = x*cos + k.x*sin;
  v.y = y*cos + k.y*sin;
  v.z = z*cos + k.z*sin;

  k.x = k.x*cos - x*sin;
  k.y = k.y*cos - y*sin;
  k.z = k.z*cos - z*sin;
}

export function orthonorm(v: Vec3, ks: Vec3[]) {
  let { x: vx, y: vy, z: vz } = v;

  for (const { x: kx, y: ky, z: kz } of ks) {
    const vk = vx*kx+vy*ky+vz*kz;

    vx -= kx*vk;
    vy -= ky*vk;
    vz -= kz*vk;
  }

  const len = Math.hypot(vx, vy, vz);

  v.x = vx / len;
  v.y = vy / len;
  v.z = vz / len;
}