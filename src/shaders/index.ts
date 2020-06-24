import {
  Regl,
  DrawConfig,
  Texture2D,
  Buffer,
  DynamicVariableFn,
  DefaultContext,
} from "regl";

import { InnerShapeProps, JoinStyle } from "..";

import { createRectShader } from "./rect-shader";
import { createMiterShader } from "./miter-shader";

export type BufferAttribute = {
  buffer: Buffer | DynamicVariableFn<Buffer, DefaultContext, InnerShapeProps>;
  offset: number;
  stride: number;
  divisor: number;
};

type ShaderUniforms = {
  miterMode: number;
  miterLimit: number;

  scale: number[];
  scaleFract: number[];

  translate: number[];
  translateFract: number[];

  dashSize: number;
  dashPattern: Texture2D;

  thickness: number;
  opacity: number;
  pixelRatio: number;
  viewport: number[];
  depth: number;
};

export type ShaderDrawConfig<Attributes> = DrawConfig<
  ShaderUniforms,
  Attributes,
  InnerShapeProps
>;

function createBaseOptions(regl: Regl): ShaderDrawConfig<undefined> {
  return {
    primitive: "triangle strip",
    instances: (_, p) => p.count,
    count: 4,
    offset: 0,

    uniforms: {
      miterMode: (_, prop) => (prop.join === JoinStyle.Round ? 2 : 1),
      miterLimit: (_, p) => p.miterLimit,
      scale: (_, p) => p.scale,
      scaleFract: (_, p) => p.scaleFract,
      translateFract: (_, p) => p.translateFract,
      translate: (_, p) => p.translate,
      thickness: (_, p) => p.thickness,
      dashPattern: (_, p) => p.dashTexture,
      opacity: (_, p) => p.opacity,
      pixelRatio: (ctx) => ctx.pixelRatio,
      dashSize: (_, p) => p.dashLength,
      viewport: ({ viewportWidth, viewportHeight }, { viewport: { x, y } }) => [
        x || 0,
        y || 0,
        viewportWidth,
        viewportHeight,
      ],
      depth: (_, p) => p.depth,
    },

    blend: {
      enable: true,
      color: [0, 0, 0, 0],
      equation: {
        rgb: "add",
        alpha: "add",
      },
      func: {
        srcRGB: "src alpha",
        dstRGB: "one minus src alpha",
        srcAlpha: "one minus dst alpha",
        dstAlpha: "one",
      },
    },
    depth: (_, p) => ({
      enable: !p.overlay,
    }),
    stencil: { enable: false },
    scissor: {
      enable: true,
      box: (_, p) => p.viewport,
    },
    viewport: (_, p) => p.viewport,
  };
}

export function createShaders(regl: Regl) {
  const offsetBuffer = regl.buffer({
    usage: "static",
    type: "float",
    data: [0, 1, 0, 0, 1, 1, 1, 0],
  });

  const baseOptions = createBaseOptions(regl);

  const rect = createRectShader(regl, offsetBuffer, baseOptions);

  let miter = null;
  try {
    miter = createMiterShader(regl, offsetBuffer, baseOptions);
  } catch {
    miter = rect;
    console.log("No support for miter lines.");
  }

  return { rect, miter };
}
