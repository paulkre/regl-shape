# regl-shape

2D shape renderer for regl.

## Usage

```javascript
import createRegl from "regl";
import createShapeBuilder from "regl-shape";

export const regl = createRegl({
  extensions: ["ANGLE_instanced_arrays"],
});

const { createShape } = createShapeBuilder(regl);

const res = 32;
const points = new Float64Array(2 * res).fill(0);

const shape = createShape(points, {
  count: res,
  join: "round",
  color: Array(res)
    .fill()
    .map(() => [Math.random(), Math.random(), Math.random()]),
});

regl.frame(({ tick }) => {
  regl.clear({ color: [0, 0, 0, 1] });

  for (let i = 0; i < res; i++) {
    const phi = (tick / 100) * (i / res) * 2 * Math.PI;
    const rad = Math.pow(0.95, i);
    points[2 * i] = rad * Math.sin(phi);
    points[2 * i + 1] = rad * Math.cos(phi);
  }

  shape();
});
```
