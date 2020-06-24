import earcut from "earcut";

export function triangulate(points: Float64Array): number[] {
  // const pos = [];

  // filter bad vertices and remap triangles to ensure shape
  // const ids = {};
  // const lastId = 0;

  // for (let i = 0, ptr = 0; i < count; i++) {
  //   let x = points[i * 2];
  //   let y = points[i * 2 + 1];
  //   if (isNaN(x) || isNaN(y) || x == null || y == null) {
  //     x = points[lastId * 2];
  //     y = points[lastId * 2 + 1];
  //     ids[i] = lastId;
  //   } else {
  //     lastId = i;
  //   }
  //   pos[ptr++] = x;
  //   pos[ptr++] = y;
  // }

  let triangles = earcut(points);

  // for (let i = 0, l = triangles.length; i < l; i++) {
  //   if (ids[triangles[i]] != null) triangles[i] = ids[triangles[i]];
  // }

  return triangles;
}
