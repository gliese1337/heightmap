async function LoadMap(map, filenames) {
  const tempcanvas = document.createElement("canvas");
  const tempcontext = tempcanvas.getContext("2d");
  
  const data = filenames
    .split(";")
    .map(name => new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        tempcanvas.width = map.width;
        tempcanvas.height = map.height;
        tempcontext.drawImage(image, 0, 0, map.width, map.height);
        resolve(tempcontext.getImageData(0, 0, map.width, map.height).data);
      };
      image.src = `maps/${name}.png`;
    }));

  const [ datac, datah ] = await Promise.all(data);

  const size = map.width*map.height;
  for (let i=0,j=0; i<size; i++, j+=4) {
    map.color[i] = (datah[j] << 24) | (datac[j + 2] << 16) | (datac[j + 1] << 8) | datac[j];
  }
}