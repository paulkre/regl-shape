precision highp float;

attribute vec2 aCoord, bCoord, aCoordFract, bCoordFract;
attribute vec4 color;
attribute float lineEnd, lineTop;

uniform vec2 scale, scaleFract, translate, translateFract;
uniform float thickness, pixelRatio, depth;
uniform vec4 viewport;

varying vec4 fragColor;
varying vec2 tangent;

vec2 project(vec2 position, vec2 positionFract, vec2 scale, vec2 scaleFract, vec2 translate, vec2 translateFract) {
  // the order is important
  return position * scale + translate
    + positionFract * scale + translateFract
    + position * scaleFract
    + positionFract * scaleFract;
}

vec2 getPointPosition() {
  if (lineEnd == 1.) {
    return project(bCoord, bCoordFract, scale, scaleFract, translate, translateFract);
  } else {
    return project(aCoord, aCoordFract, scale, scaleFract, translate, translateFract);
  }
}

void main() {
  vec2 diff = (bCoord + bCoordFract - aCoord - aCoordFract);
  tangent = normalize(diff * scale * viewport.zw);
  vec2 normal = vec2(-tangent.y, tangent.x);
  vec2 lineOffset = thickness * (lineTop - .5) * normal;

  lineOffset /= viewport.zw;

  vec2 position = getPointPosition() + lineOffset;

  gl_Position = vec4(position * 2.0 - 1.0, depth, 1);

  fragColor = color / 255.;
}