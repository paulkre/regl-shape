# regl-shape

2D shape shader for regl.

A lot of the code in this package was converted from [regl-line](https://www.npmjs.com/package/regl-line) to fit modern development approaches. I recommend using [webpack](https://www.npmjs.com/package/webpack) with [glslify-loader](https://www.npmjs.com/package/glslify-loader) to import this package.

## Usage

This package is focused on minimizing memory consumption to prevent unnecessary garbage collection so that even large shapes can be rendered and animated in realtime. For this reason the package's API requires you to initialize the array of points that make up the shape only once before you create the shape. To change the point positions after creation, you have to mutate the data of this array. In order to maximize performance the point array has to be a [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) (I recommend [Float64Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float64Array)).

```javascript
import createRegl from "regl";
import createShapeBuilder from "regl-shape";

const regl = createRegl();
const { createShape } = createShapeBuilder(regl);

const points = new Float64Array(64);
const shape = createShape(points);

regl.frame(() => {
  for (let i = 0; i < points.length; i++) {
    // Mutate the point positions here.
  }
  shape();
})
```

## Example

![Example Screenshot](https://github.com/paulkre/regl-shape/blob/master/dev/screenshot.png?raw=true)

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
