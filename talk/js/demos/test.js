DEMO.Test = DEMO.ShadertoyBase.extend(function(canvas){
	var shader = [
		'void mainImage(out vec4 col, in vec2 fp){',
		'	vec2 p = fp / iResolution.xy - vec2(.5);',
		'	float aspect = iResolution.x / iResolution.y;',
		'	p.x *= aspect;',
		'	col = vec4(0.0, 0.0, 0.0, 1.0);',
		'	if(distance(p, vec2(0.)) < .5){',
		'		col.r = 1.0;',
		'	}',
		'}'
	].join('\n');

	DEMO.Test.parent.call(this, canvas, shader, 1.0);
});