import createRegl from "regl";
import createShapeBuilder from "../src";
import hsl from "hsl-rgb";

const regl = createRegl({ extensions: ["ANGLE_instanced_arrays"] });
const { createShape } = createShapeBuilder(regl);

const pointCounts = [3, 4, 5, 6, 7, 128];
const radius = 0.667;

const shapes = pointCounts.map((pointCount, i) => {
  const points = new Float64Array(2 * pointCount);
  const phi = (i / pointCounts.length) * 2 * Math.PI;
  const x = radius * Math.sin(phi);
  const y = radius * Math.cos(phi);
  const strokeColor = hsl(360 * (i / pointCounts.length), 1, 0.5);
  const fillColor = [...strokeColor, 0.5];

  for (let j = 0; j < pointCount; j++) {
    let phu = (j / pointCount) * 2 * Math.PI;
    if (!(pointCount % 2)) phu += Math.PI / 4;
    points[2 * j] = x + radius * Math.sin(phu);
    points[2 * j + 1] = y + radius * 0.75 * Math.cos(phu);
  }

  return createShape(points, {
    join: "round",
    thickness: 8,
    fill: [1, 0, 0, 0.5],
    close: true,
    color: strokeColor,
    fill: fillColor,
  });
});

regl.frame(() => {
  regl.clear({ color: [0, 0, 0, 1] });
  shapes.forEach((shape) => {
    shape();
  });
});
