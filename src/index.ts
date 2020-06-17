import { Regl, Buffer, Texture2D, BoundingBox } from "regl";
import { InputColor as Color } from "color-normalize";
import getBounds, { Bounds } from "array-bounds";
import normalize from "array-normalize";
// import triangulate from "earcut";

import { createShaders } from "./shaders";
import { updateDashTextureAndGetLength } from "./update-dash-texture";
import { updateColorBuffer } from "./update-color-buffer";

export enum JoinType {
  Miter = "miter",
  Round = "round",
  Rect = "rect",
}

export type ShapeProps = {
  dashes: number[] | null;
  join: JoinType;
  miterLimit: number;
  thickness: number;
  color: Color | Color[];
  opacity: number;
  overlay: boolean;
  viewport: BoundingBox;
  close: boolean;
  count: number;
  depth: number;
  range: Bounds;
  // fill: any;
};

export interface InnerShapeProps extends ShapeProps {
  scale: number[];
  scaleFract: number[];

  translate: number[];
  translateFract: number[];

  dashLength: number;
  dashTexture: Texture2D;

  colorBuffer: Buffer;

  positionBuffer: Buffer;
  positionFractBuffer: Buffer;
}

function createDefaultProps(regl: Regl): ShapeProps {
  return {
    dashes: null,
    join: JoinType.Miter,
    miterLimit: 1,
    thickness: 12,
    color: "white",
    opacity: 1,
    overlay: false,
    viewport: {
      x: 0,
      y: 0,
      width: regl._gl.drawingBufferWidth,
      height: regl._gl.drawingBufferHeight,
    },
    close: false,
    count: 0,
    depth: 0,
    range: [-1, -1, 1, 1],
    // fill: null,
  };
}

// const maxLines = 2048;
// const maxPoints = 10000;

export default function (regl: Regl) {
  const shaders = createShaders(regl);
  const defaultProps = createDefaultProps(regl);

  return {
    createShape(
      points: Float64Array,
      partialInitialProps?: Partial<ShapeProps>
    ) {
      const initialProps: ShapeProps = {
        ...defaultProps,
        ...partialInitialProps,
      };

      const normPoints = new Float64Array(points.length);
      const pointsData = new Float64Array(points.length + 6);

      const pointsDataFloat32 = new Float32Array(pointsData.length);
      const pointsDataFloat32Fract = new Float32Array(pointsData.length);

      const colorData = new Uint8Array(2 * points.length + 4);

      const colorBuffer = regl.buffer({
        usage: "dynamic",
        type: "uint8",
        data: colorData,
      });

      const positionBuffer = regl.buffer({
        usage: "dynamic",
        type: "float",
        data: pointsDataFloat32,
      });

      const positionFractBuffer = regl.buffer({
        usage: "dynamic",
        type: "float",
        data: pointsDataFloat32Fract,
      });

      const dashTexture = regl.texture({
        channels: 1,
        data: new Uint8Array([255]),
        width: 1,
        height: 1,
        mag: "linear",
        min: "linear",
      });

      return (partialProps?: Partial<ShapeProps>) => {
        const props: ShapeProps = { ...initialProps, ...partialProps };

        let { count, color, close, join, range, dashes } = props;

        // create fill points
        // if (state.fill) {
        //   const pos = [];

        //   // filter bad vertices and remap triangles to ensure shape
        //   const ids = {};
        //   const lastId = 0;

        //   for (let i = 0, ptr = 0, l = state.count; i < l; i++) {
        //     let x = points[i * 2];
        //     let y = points[i * 2 + 1];
        //     if (isNaN(x) || isNaN(y) || x == null || y == null) {
        //       x = points[lastId * 2];
        //       y = points[lastId * 2 + 1];
        //       ids[i] = lastId;
        //     } else {
        //       lastId = i;
        //     }
        //     pos[ptr++] = x;
        //     pos[ptr++] = y;
        //   }

        //   let triangles = triangulate(pos, []);

        //   for (let i = 0, l = triangles.length; i < l; i++) {
        //     if (ids[triangles[i]] != null) triangles[i] = ids[triangles[i]];
        //   }

        //   state.triangles = triangles;
        // }

        // update position buffers
        const flatCount = 2 * count;
        const bounds = getBounds(
          points.length > flatCount ? points.slice(0, flatCount) : points,
          2
        );
        normPoints.set(points);
        normalize(normPoints, 2, bounds);

        const startIsEnd =
          points[0] === points[flatCount - 2] &&
          points[1] === points[flatCount - 1];

        // rotate first segment join
        if (close) {
          if (startIsEnd) {
            pointsData[0] = normPoints[flatCount - 4];
            pointsData[1] = normPoints[flatCount - 3];
          } else {
            pointsData[0] = normPoints[flatCount - 2];
            pointsData[1] = normPoints[flatCount - 1];
          }
        } else {
          pointsData[0] = normPoints[0];
          pointsData[1] = normPoints[1];
        }

        pointsData.set(normPoints, 2);

        // add last segment
        if (close) {
          // ignore coinciding start/end
          if (startIsEnd) {
            pointsData[flatCount + 2] = normPoints[2];
            pointsData[flatCount + 3] = normPoints[3];
            count--;
          } else {
            pointsData[flatCount + 2] = normPoints[0];
            pointsData[flatCount + 3] = normPoints[1];
            pointsData[flatCount + 4] = normPoints[2];
            pointsData[flatCount + 5] = normPoints[3];
          }
        }
        // add stub
        else {
          pointsData[flatCount + 2] = normPoints[flatCount - 2];
          pointsData[flatCount + 3] = normPoints[flatCount - 1];
          pointsData[flatCount + 4] = normPoints[flatCount - 2];
          pointsData[flatCount + 5] = normPoints[flatCount - 1];
        }

        pointsDataFloat32.set(pointsData);
        for (let i = 0; i < flatCount; i++)
          pointsDataFloat32Fract[i] = pointsData[i] - pointsDataFloat32[i];

        positionBuffer.subdata(pointsDataFloat32);
        positionFractBuffer.subdata(pointsDataFloat32Fract);

        const boundsW = bounds[2] - bounds[0];
        const boundsH = bounds[3] - bounds[1];

        const rangeW = range[2] - range[0];
        const rangeH = range[3] - range[1];

        const scale = [boundsW / rangeW, boundsH / rangeH];
        const translate = [
          -range[0] / rangeW + bounds[0] / rangeW || 0,
          -range[1] / rangeH + bounds[1] / rangeH || 0,
        ];

        const scale32 = new Float32Array(scale);
        const scaleFract = [scale[0] - scale32[0], scale[1] - scale32[1]];

        const translate32 = new Float32Array(translate);
        const translateFract = [
          translate[0] - translate32[0],
          translate[1] - translate32[1],
        ];

        const dashLength = dashes
          ? updateDashTextureAndGetLength(dashTexture, dashes)
          : 1;

        if (color) updateColorBuffer(colorBuffer, colorData, color, count);

        const renderProps = {
          ...props,

          translate,
          translateFract,

          scale,
          scaleFract,

          colorBuffer,

          positionBuffer,
          positionFractBuffer,

          dashLength,
          dashTexture,
        };

        if (join === JoinType.Rect) shaders.rect(renderProps);
        else shaders.miter(renderProps);
      };
    },
  };
}
