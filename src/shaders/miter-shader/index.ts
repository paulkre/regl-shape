import { Regl, Buffer } from "regl";

import { ShaderDrawConfig, BufferAttribute } from "..";

export type MiterShaderAttributes = {
  lineEnd: BufferAttribute;
  lineTop: BufferAttribute;
  aColor: BufferAttribute;
  bColor: BufferAttribute;
  prevCoord: BufferAttribute;
  aCoord: BufferAttribute;
  bCoord: BufferAttribute;
  nextCoord: BufferAttribute;
};

import vert from "./shader.vert";
import frag from "./shader.frag";

export function createMiterShader(
  regl: Regl,
  offsetBuffer: Buffer,
  baseOptions: ShaderDrawConfig<undefined>
) {
  const drawConfig: ShaderDrawConfig<MiterShaderAttributes> = {
    ...baseOptions,

    // culling removes polygon creasing
    cull: {
      enable: true,
      face: "back",
    },

    vert,
    frag,

    attributes: {
      // is line end
      lineEnd: {
        buffer: offsetBuffer,
        divisor: 0,
        stride: 8,
        offset: 0,
      },
      // is line top
      lineTop: {
        buffer: offsetBuffer,
        divisor: 0,
        stride: 8,
        offset: 4,
      },
      // left color
      aColor: {
        buffer: (_, props) => props.colorBuffer,
        stride: 4,
        offset: 0,
        divisor: 1,
      },
      // right color
      bColor: {
        buffer: (_, props) => props.colorBuffer,
        stride: 4,
        offset: 4,
        divisor: 1,
      },
      prevCoord: {
        buffer: (_, props) => props.positionBuffer,
        stride: 8,
        offset: 0,
        divisor: 1,
      },
      aCoord: {
        buffer: (_, props) => props.positionBuffer,
        stride: 8,
        offset: 8,
        divisor: 1,
      },
      bCoord: {
        buffer: (_, props) => props.positionBuffer,
        stride: 8,
        offset: 16,
        divisor: 1,
      },
      nextCoord: {
        buffer: (_, props) => props.positionBuffer,
        stride: 8,
        offset: 24,
        divisor: 1,
      },
    },
  };
  return regl(drawConfig);
}
