import { Buffer } from "regl";
import rgba, { InputColor } from "color-normalize";

export function updateColorBuffer(
  colorBuffer: Buffer,
  colorData: Uint8Array,
  colors: InputColor | InputColor[],
  count: number
) {
  // convert colors to typed arrays
  if (!Array.isArray(colors)) {
    let c = rgba(colors, "uint8");

    for (let i = 0; i < count + 1; i++) {
      colorData.set(c, i * 4);
    }
  } else {
    for (let i = 0; i < count; i++) {
      let c = rgba(colors[i], "uint8");
      colorData.set(c, i * 4);
    }
    colorData.set(rgba(colors[0], "uint8"), count * 4);
  }

  colorBuffer.subdata(colorData);
}
