import { Vec3, vec_rot2, orthonorm, vec_add } from "./Vectors";
import { ControlStates } from './ControlConfig';
import { GameMap } from './GameMap';

const planes = { x: 'fwd', y: 'rgt', z: 'ana' };

const turnRate = Math.PI / 2.75;

export default class Player {
  public fwd: Vec3 = { x: 1, y: 0, z: 0 };
  public rgt: Vec3= { x: 0, y: 1, z: 0 };
  public ana: Vec3 = { x: 0, y: 0, z: 1 };

  constructor(public pos: Vec3, public altitude: number) { }

  rotate(v: keyof Vec3, k: keyof Vec3, angle: number) {
    const vn = planes[v] as "rgt"|"fwd"|"ana";
    const kn = planes[k] as "rgt"|"fwd"|"ana";
    vec_rot2(this[vn], this[kn], angle);
  }

  renormalize() {
    const { rgt, fwd, ana } = this;
    orthonorm(fwd, []);
    orthonorm(rgt, [fwd]);
    orthonorm(ana, [fwd, rgt]);
  }

  update_pos(controls: ControlStates, seconds: number, map: GameMap) {
    const { pos, fwd } = this;
    if (controls.forwardbackward !== 0) {
      vec_add(pos, seconds * controls.forwardbackward, fwd);
      // Collision detection. Don't fly below the surface.
      this.altitude = Math.max(this.altitude, map.altitude(pos.x, pos.y, pos.z) + 10);
      return true;
    }

    return false;
  }

  update_lookat(controls: ControlStates, seconds: number) {
    const angle = seconds * turnRate;
    let moved = false;

    if (controls.leftright === 1) {
      this.rotate('y', 'x', angle);
      moved = true;
    } else if (controls.leftright === -1) {
      this.rotate('x', 'y', angle);
      moved = true;
    }
    
    if (controls.anakata === 1) {
      this.rotate('z', 'x', angle);
      moved = true;
    } else if (controls.anakata === -1) {
      this.rotate('x', 'z', angle);
      moved = true;
    }
    
    if (controls.fourroll === 1) {
      this.rotate('z', 'y', angle);
      moved = true;
    } else if (controls.fourroll === -1) {
      this.rotate('y', 'z', angle);
      moved = true;
    }

    return moved;
  }

  update(controls: ControlStates, seconds: number, map: GameMap) {
    let moved = false;

    if (controls.mouse) {
      const { mouseX, mouseY } = controls;
      if (mouseX !== 0) {
        this.rotate('y', 'x', mouseX * Math.PI * seconds);
        moved = true;
      }
      if (mouseY !== 0) {
        this.altitude += mouseY * seconds * 30;
        moved = true;
      }
    }

    if (controls.updown !== 0) {
      this.altitude += controls.updown * seconds * 30;
      moved = true;
    }

    moved = this.update_lookat(controls, seconds);
    
    if (moved) {
      this.renormalize();
    }
    
    return this.update_pos(controls, seconds, map) || moved;
  }
}
