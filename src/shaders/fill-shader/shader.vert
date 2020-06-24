precision highp float;

attribute vec2 position, positionFract;

uniform vec4 color;
uniform vec2 scale, scaleFract, translate, translateFract;
uniform float pixelRatio;
uniform vec4 viewport;
uniform float opacity;
uniform float depth;

varying vec4 fragColor;

void main() {
	vec2 position = position * scale + translate
       + positionFract * scale + translateFract
       + position * scaleFract
       + positionFract * scaleFract;

	gl_Position = vec4(position * 2.0 - 1.0, depth, 1);

	fragColor = color / 255.;
	fragColor.a *= opacity;
}