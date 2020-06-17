declare module "array-bounds" {
  export type Bounds = [number, number, number, number];
  const getBounds: (array: Float64Array, dimension: number) => Bounds;
  export default getBounds;
}

declare module "array-normalize" {
  import { Bounds } from "array-bounds";
  const normalize: (
    array: Float64Array,
    dimension: number,
    bounds: Bounds
  ) => void;
  export default normalize;
}

declare module "color-normalize" {
  export type InputColor =
    | string
    | Float32Array
    | Uint8Array
    | number[]
    | number;
  type ColorDType = "uint8" | "uint8_clamped" | "array" | "float32" | "float64";
  type OutputColor = Uint8Array | Float64Array | Uint8ClampedArray | number[];
  const rgba: (color: InputColor, type: ColorDType) => OutputColor;
  export default rgba;
}

declare module "*.vert" {
  const vertShader: string;
  export default vertShader;
}

declare module "*.frag" {
  const vertShader: string;
  export default vertShader;
}
