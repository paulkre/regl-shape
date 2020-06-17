import { Texture2D } from "regl";

const dashMult = 2;

export function updateDashTextureAndGetLength(
  texture: Texture2D,
  dashes: number[]
) {
  let dashLength = 0;
  let dashData = null;

  if (dashes.length < 2) {
    dashLength = 1;
    dashData = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255]);
  } else {
    dashLength = 0;
    for (let i = 0; i < dashes.length; ++i) {
      dashLength += dashes[i];
    }
    dashData = new Uint8Array(dashLength * dashMult);
    let ptr = 0;
    let fillColor = 255;

    // repeat texture two times to provide smooth 0-step
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < dashes.length; ++i) {
        for (let j = 0, l = dashes[i] * dashMult * 0.5; j < l; ++j) {
          dashData[ptr++] = fillColor;
        }
        fillColor ^= 255;
      }
    }
  }

  texture.subimage(
    {
      channels: 1,
      data: dashData,
      width: dashData.length,
      height: 1,
      mag: "linear",
      min: "linear",
    },
    0,
    0
  );

  return dashLength;
}
