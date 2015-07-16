DEMO.GeoPattern = DEMO.ScreenShader.extend(function(canvas){
	var pixelShader = [
		'#define PI  3.14159265359',
		'#define time time*0.1',

		'struct Line{',
		'    vec2 start;',
		'    vec2 direction;',
		'};',

		'float leftOfLine(in Line l, vec2 p){',
		'    vec2 d2l = l.start - p;',
		'    //float dAlongLine = dot(d2l, normalize(l.direction));',
		'    return dot(d2l, vec2(l.direction.y, -l.direction.x));',
		'}',

		'float scale = 0.9;',

		'void mainImage( out vec4 fragColor, in vec2 fragCoord ){',
		'    vec3 col = vec3(0.0);',
		'    vec2 p = uvp;',
		'    float aspect = resolution.x/resolution.y;',
		'    p.x *= aspect;',
		'    p.x += (1. - aspect) * .5;',
		'    ',
		'    //p.x += sin((p.y*p.x*2.0-.5)*5.0)*pow(sin(p.y*PI), 1.)*sin(time)*.25;',
		'    p -= vec2(.5);',
		'    p *= scale;',
		'   ',
		'    //draw polygon',
		'    vec2 center = vec2(0., 0.);',
		'    float rot = 0.0;',
		'    float r = ((sin(time * .5) + 1.0)*.5) * .5;',
		'    ',
		'    const int n = 7;',
		'    float a = PI * 2. / float(n);',


		'    for(int i = 0; i < n; i++){',
		'        float j = float(i) * a;',
		'        ',
		'        vec2 start = vec2(cos(j + rot), sin(j + rot));',
		'        j += a;',
		'        vec2 start2 = vec2(cos(j + rot), sin(j + rot));',
		'        ',
		'        Line l = Line(start*r + center, normalize(start2 - start));',
		'        ',
		'        float f = leftOfLine(l, p);',
		'        float m = 40.;',
		'        float mf = 1.0 + 0.005;',
		'        col.r += 0.5*sin(f*m);m*=mf;',
		'        col.g += 0.5*sin(f*m);m*=mf;',
		'        col.b += 0.5*sin(f*m);',
		'    }',

		'    //float d2c = distance(p, center) / scale;',
		'    //col *= clamp(d2c * d2c * d2c * 0.1, 0., 1.0);',
		'    col = clamp(col, 0., 1.0);',

		'    fragColor = vec4(1. - col, 1.0);   ',
		'}',

		'void main(){',
		'    mainImage(gl_FragColor, gl_FragCoord.xy);',
		'}'
	].join('\n');

	//super
	DEMO.GeoPattern.parent.call(this, canvas, pixelShader, .25);
});