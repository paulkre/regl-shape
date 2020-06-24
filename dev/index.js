import createRegl from "regl";
import createShapeBuilder from "../src";

const regl = createRegl({ extensions: ["ANGLE_instanced_arrays"] });
const { createShape } = createShapeBuilder(regl);

const res = 12;
const points = new Float64Array(2 * res).fill(0);

const shape = createShape(points, {
  join: "round",
  thickness: 8,
  fill: [1, 0, 0, 0.5],
  close: true,
});

for (let i = 0; i < res; i++) {
  const phi = Math.PI / 4 + (i / res) * 2 * Math.PI;
  const rad = 0.75;
  points[2 * i] = rad * Math.sin(phi);
  points[2 * i + 1] = rad * Math.cos(phi);
}

regl.frame(() => {
  regl.clear({ color: [0, 0, 0, 1] });
  shape();
});
