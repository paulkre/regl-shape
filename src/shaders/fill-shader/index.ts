import { Regl, Buffer, PrimitiveType } from "regl";

import { ShaderDrawConfig, BufferAttribute, ShaderUniforms } from "..";

interface FillShaderUniforms extends ShaderUniforms {
  color: Uint8Array;
}

type FillShaderAttributes = {
  position: BufferAttribute;
  positionFract: BufferAttribute;
};

import vert from "./shader.vert";
import frag from "./shader.frag";

export function createFillShader(
  regl: Regl,
  { blend, scissor, stencil, viewport, uniforms }: ShaderDrawConfig<undefined>
) {
  const drawConfig: ShaderDrawConfig<
    FillShaderAttributes,
    FillShaderUniforms
  > = {
    blend,
    scissor,
    stencil,
    viewport,

    // @ts-ignore
    primitive: "triangles",
    elements: (_, p) => p.triangles,
    offset: 0,

    vert,
    frag,

    uniforms: {
      ...uniforms!,
      color: (_, p) => p.fillColor!,
    },

    attributes: {
      position: {
        buffer: (_, p) => p.positionBuffer,
        stride: 8,
        offset: 8,
      },
      positionFract: {
        buffer: (_, p) => p.positionFractBuffer,
        stride: 8,
        offset: 8,
      },
    },

    depth: { enable: false },
  };

  console.log(drawConfig);

  return regl(drawConfig);
}
