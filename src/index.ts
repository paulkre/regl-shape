import { Regl, Buffer, Texture2D, BoundingBox } from "regl";
import { InputColor } from "color-normalize";
import getBounds, { Bounds } from "array-bounds";
import normalize from "array-normalize";
import rgba from "color-normalize";
import triangulate from "earcut";

import { createShaders } from "./shaders";
import { updateDashTextureAndGetLength } from "./update-dash-texture";
import { updateColorBuffer } from "./update-color-buffer";

export enum JoinStyle {
  Bevel = "bevel",
  Round = "round",
  Rect = "rect",
}

export type ShapeProps = {
  /** Number of points to in the shape. */
  count: number;

  /** Stroke color of the shape. Can either be a single color or an array of colors containing a color for every point in the shape. The format of a single color is either a CSS color string or an array with `0..1` values, eg. `"red"` or `[0, 0, 0, 1]`. */
  color: InputColor | InputColor[];

  /** Fill area enclosed by line with defined color. */
  fill: InputColor | null;

  /** Transparency of the shape's stroke (`0..1`). */
  opacity: number;

  /** Thickness of the shape's stroke in px (`>0`). */
  thickness: number;

  /** Array with dash lengths in px, altering color/space pairs, ie. `[2,10, 5,10, ...]`. `null` corresponds to solid line. */
  dashes: number[] | null;

  /** Join style: `"rect"`, `"round"`, `"bevel"`. Applied to caps too. */
  join: JoinStyle;

  /** Max ratio of the join length to the thickness. */
  miterLimit: number;

  /** Connect last point with the first point with a stroke. */
  close: boolean;

  /** Enable overlay of line segments. */
  overlay: boolean;

  /** Visible data range. */
  range: Bounds;

  /** Area within canvas. */
  viewport: BoundingBox;

  /** Value for the z-axis of the shapes position. */
  depth: number;
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

  triangles: number[] | null;
  fillColor: Uint8Array | null;
}

export default function (regl: Regl) {
  const shaders = createShaders(regl);
  let shapeCount = 0;

  return {
    createShape(
      points: Float64Array,
      initialPartialProps?: Partial<ShapeProps>
    ) {
      const id = shapeCount;
      shapeCount++;

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
        const props: ShapeProps = {
          count: Math.floor(points.length / 2),
          color: "white",
          fill: null,
          thickness: 1,
          dashes: null,
          join: JoinStyle.Bevel,
          miterLimit: 1,
          close: false,
          opacity: 1,
          overlay: false,
          range: [-1, -1, 1, 1],
          viewport: {
            x: 0,
            y: 0,
            width: regl._gl.drawingBufferWidth,
            height: regl._gl.drawingBufferHeight,
          },
          depth: -0.01 * id,

          ...initialPartialProps,
          ...partialProps,
        };

        let { count, color, close, join, range, dashes, fill } = props;

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

        const renderProps: InnerShapeProps = {
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

          triangles: fill ? triangulate(points) : null,
          fillColor: fill ? rgba(fill, "uint8") : null,
        };

        regl._refresh();

        if (fill) shaders.fill(renderProps);

        if (join === JoinStyle.Rect) shaders.rect(renderProps);
        else shaders.miter(renderProps);
      };
    },
  };
}
