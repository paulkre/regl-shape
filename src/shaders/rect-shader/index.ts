import { Regl, Buffer } from "regl";

import { ShaderDrawConfig, BufferAttribute } from "..";

import vert from "./shader.vert";
import frag from "./shader.frag";

export type RectShaderAttributes = {
  lineEnd: BufferAttribute;
  lineTop: BufferAttribute;
  aCoord: BufferAttribute;
  bCoord: BufferAttribute;
  aCoordFract: BufferAttribute;
  bCoordFract: BufferAttribute;
  color: BufferAttribute;
};

export function createRectShader(
  regl: Regl,
  offsetBuffer: Buffer,
  baseOptions: ShaderDrawConfig<undefined>
) {
  const drawConfig: ShaderDrawConfig<RectShaderAttributes> = {
    ...baseOptions,

    vert,
    frag,

    attributes: {
      // if point is at the end of segment
      lineEnd: {
        buffer: offsetBuffer,
        divisor: 0,
        stride: 8,
        offset: 0,
      },
      // if point is at the top of segment
      lineTop: {
        buffer: offsetBuffer,
        divisor: 0,
        stride: 8,
        offset: 4,
      },
      // beginning of line coordinate
      aCoord: {
        buffer: (_, props) => props.positionBuffer,
        stride: 8,
        offset: 8,
        divisor: 1,
      },
      // end of line coordinate
      bCoord: {
        buffer: (_, props) => props.positionBuffer,
        stride: 8,
        offset: 16,
        divisor: 1,
      },
      aCoordFract: {
        buffer: (_, props) => props.positionFractBuffer,
        stride: 8,
        offset: 8,
        divisor: 1,
      },
      bCoordFract: {
        buffer: (_, props) => props.positionFractBuffer,
        stride: 8,
        offset: 16,
        divisor: 1,
      },
      color: {
        buffer: (_, props) => props.colorBuffer,
        stride: 4,
        offset: 0,
        divisor: 1,
      },
    },
  };

  return regl(drawConfig);
}
