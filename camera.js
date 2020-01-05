function UpdateCamera(camera, input, map, time) {
  const current = +new Date();

  input.keypressed = false;
  if (input.leftright != 0) {
    camera.angle += input.leftright*0.1*(current-time)*0.03;
    camera.sin = Math.sin(camera.angle);
    camera.cos = Math.cos(camera.angle);
    input.keypressed = true;
  }
  if (input.forwardbackward != 0) {
    camera.x -= input.forwardbackward * Math.sin(camera.angle) * (current-time)*0.03;
    camera.y -= input.forwardbackward * Math.cos(camera.angle) * (current-time)*0.03;
    input.keypressed = true;
  }
  if (input.updown != 0) {
    camera.height += input.updown * (current-time)*0.03;
    input.keypressed = true;
  }
  if (input.lookup) {
    camera.horizon += 2 * (current-time)*0.03;
    input.keypressed = true;
  }
  if (input.lookdown) {
    camera.horizon -= 2 * (current-time)*0.03;
    input.keypressed = true;
  }

  // Collision detection. Don't fly below the surface.
  const mapoffset = ((camera.y & (map.width-1)) << map.shift) + (camera.x & (map.height-1));
  const height = (map.color[mapoffset]>>24)+10;
  if (height > camera.height) camera.height = height;

  return current;
}