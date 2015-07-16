/*

	Illuminated 3D triangle webgl demo, v5

*/

DEMO.Triangle5 = DEMO.Demo.extend(function(canvas){
	DEMO.Triangle5.parent.call(this, canvas);//super

	//set the canvas attribute dimensions (not just the style dimensions)
	this.canvas.width = this.width();
	this.canvas.height = this.height();

	var gl = this.canvas.getContext('webgl');
	this.gl = gl;

	this.shadersNeedCompile = true;

	//webgl settings
	gl.clearColor(0, 0, 0, 1);
	gl.disable(gl.CULL_FACE); //makes triangles visible even if they face away

	/* ---- Create Shaders ---- */
	//the do nothing geometry shader
	this.geometryShaderSrc = [
		'precision mediump float;',

		'#define PI 3.14159265359',

		'attribute vec2 position;',
		'uniform float time;',
		'uniform vec2 resolution;',

		'varying vec2 uv;',
		'varying vec4 pos;',
		'varying vec3 transformedNormal;',

		'void main(){',
			'vec3 p = vec3(position.xy, 0.0);',
			'uv = (p.xy + vec2(1.0))*.5; //converts from clip space to graph space',

			'float invAspect = resolution.y / resolution.x;',

			//(accounts for aspect ration in field of view)
			'const float fov = 60.0;',
			'const float near = 0.01;',
			'const float far = 100.0;',

			//camera perspective transformation matrix
			'float f = tan(PI*.5 - .5 * radians(fov));',
			'const float invRange = 1.0 / (near - far);',
			'mat4 projectionMatrix = mat4(',
			'   f * invAspect , 0 , 0                         , 0  , ',
			'   0             , f , 0                         , 0  , ',
			'   0             , 0 , (far + near) * invRange   , -1 , ',
			'   0             , 0 , 2.0*(near*far) * invRange , 0',
			');',

			//view transformation matrix (model coords to world coords)
			//this is the position of the camera
			'vec3 t = vec3(0.0, 0.0, -3.5);',//translation
			'float s = 1.0;',//scale

			'mat4 viewMatrix = mat4(',
			'	s   , 0   , 0   , 0,',
			'	0   , s   , 0   , 0,',
			'	0   , 0   , s   , 0,',
			'	t.x , t.y , t.z , 1',
			');',

			//model transformation matrix (model's intrinsic transformation)
			//construct model transformation by rotations in X Y and Z
			'float ay = time;',
			'float ax = 0.;',
			'float az = 0.;',

			'mat4 rotY = mat4(',
			'	cos(ay) , 0 , -sin(ay) , 0  , ',
			'	0       , 1 , 0        , 0  , ',
			'	sin(ay) , 0 , cos(ay)  , 0  , ',
			'	0       , 0 , 0        , 1',
			');',

			'mat4 rotX = mat4(',
			'	1 , 0        , 0       , 0 ,',
			'	0 , cos(ax)  , sin(ax) , 0 ,',
			'	0 , -sin(ax) , cos(ax) , 0 ,',
			'	0 , 0        , 0       , 1',
			');',

			'mat4 rotZ = mat4(',
			'	cos(az)  , sin(az) , 0 , 0 ,',
			'	-sin(az) , cos(az) , 0 , 0 ,',
			'	0        , 0       , 1 , 0 ,',
			'	0        , 0       , 0 , 1',
			');',

			'mat4 modelMatrix = rotX * rotY * rotZ;',

			//position in view-space
			'pos = viewMatrix * modelMatrix * vec4(p, 1.0);',

			//transform the models normal matrix
			'const vec3 n = vec3(0, 0, 1.0);',
			'transformedNormal = (rotX * rotY * rotZ * vec4(n, 1.0)).xyz;',
			
			'gl_Position = projectionMatrix * pos;',
		'}'
	].join('\n');

	//simple gradient fragment shader
	this.pixelShaderSrc = [
		'precision mediump float;',

		'uniform float time;',
		// '#define time 12.',

		'uniform vec2 resolution;',

		'varying vec2 uv;',
		'varying vec4 pos;',
		'varying vec3 transformedNormal;',

		'void main(){',
		'	vec3 col = vec3(0);',
		'	float r = distance(uv, vec2(.5));',
		'	col.r = pow(sin(time + r), 4.);',
		'	col.g = cos(time + uv.y + r)*.5 + .5;',
		'	col.b = sin(time * 2.0 + 20. * r)*.5 + .5;',

		'	vec3 lightPos = vec3(1.0, 1.0, 1.0);',
		'	vec3 lightCol = normalize(vec3(1.0, 1.0, 1.0));',

		'	vec3 rayDir = pos.xyz;',
		'	vec3 rayReflected = reflect(rayDir, transformedNormal);',

		'	float L = max(dot(normalize(rayReflected), normalize(lightPos)), 0.0);',
		'	float D = distance(pos.xyz, lightPos);',
		'	float F = pow(L, 1.) / (D * D);',

		'	gl_FragColor = vec4(col * 0.3 + lightCol * (F * 40.), 1.0);',
		'}'
	].join('\n');

	this._compileShaders(this.geometryShaderSrc, this.pixelShaderSrc);

	/* ---- Upload Geometry ---- */
	var vertices = [
		 0.0,  1.0,
		-1.0, -1.0,
		 1.0, -1.0
	];

	vertices.elementsPerVertex = 2;

	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	this.vertexBuffer = vertexBuffer;

	//extra data on vertex buffer
	vertexBuffer.elementsPerVertex = vertices.elementsPerVertex;
	vertexBuffer.vertexCount = vertices.length / vertices.elementsPerVertex;
});

DEMO.Triangle5.prototype.render = function(dt){
	//recompile shaders if necessary
	if(this.shadersNeedCompile === true){
		this._compileShaders(this.geometryShaderSrc, this.pixelShaderSrc);
	}

	var gl = this.gl;
	var program = this.program;
	var vertexBuffer = this.vertexBuffer;

	/* ---- Draw! ---- */
	gl.useProgram(program);

	//set the vertices as the active geometry
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

	//tell the GPU about the format of the vertices
    gl.vertexAttribPointer(program.aPositionLoc, vertexBuffer.elementsPerVertex, gl.FLOAT, false, 0, 0);

    //upload the time variable
    gl.uniform1f(program.uTime, this.time);

	//set the draw region and dimension
	gl.viewport(0, 0, this.width(), this.height());

	//clear canvas from last draw
	gl.clear(gl.COLOR_BUFFER_BIT);

	//draw triangle geometry
	gl.drawArrays(gl.TRIANGLES, 0, vertexBuffer.vertexCount);
}

DEMO.Triangle5.prototype.setSize = function(w, h){
	this.canvas.width = w;
	this.canvas.height = h;
	//update resolution uniform
    this.gl.useProgram(this.program);
	this.gl.uniform2f(this.program.uResolution, this.width(), this.height());
}

DEMO.Triangle5.prototype.setPixelShader = function(pixelShaderSrc){
	this.pixelShaderSrc = pixelShaderSrc;
	this.shadersNeedCompile = true;
}

DEMO.Triangle5.prototype.setGeometryShader = function(geometryShaderSrc){
	this.geometryShaderSrc = geometryShaderSrc;
	this.shadersNeedCompile = true;
}

DEMO.Triangle5.prototype._compileShaders = function(geometryShaderSrc, pixelShaderSrc){
	var gl = this.gl;

	//remove any old programs
	if(this.program){
		gl.deleteProgram(this.program);
	}

	//create and compile
	var geometryShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(geometryShader, geometryShaderSrc);
	gl.compileShader(geometryShader);

	var pixelShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(pixelShader, pixelShaderSrc);
	gl.compileShader(pixelShader);

	//check for compilation errors
	if(!gl.getShaderParameter(geometryShader, gl.COMPILE_STATUS)){
		console.error('Geometry shader error: '+gl.getShaderInfoLog(geometryShader));
		return;
	}

	if(!gl.getShaderParameter(pixelShader, gl.COMPILE_STATUS)){
		console.error('Vertex shader error: '+gl.getShaderInfoLog(pixelShader));
		return;
	}

	var program = gl.createProgram();
	gl.attachShader(program, geometryShader);
	gl.attachShader(program, pixelShader);
	gl.linkProgram(program);
	this.program = program;

	if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
		//cleanup shaders
		gl.detachShader(program, geometryShader);
		gl.detachShader(program, pixelShader);
		gl.deleteShader(geometryShader);
		gl.deleteShader(pixelShader);
		console.error('Error linking program');
	}

	//get program's 'position' attribute memory location
	program.aPositionLoc = gl.getAttribLocation(program, "position");
	//get program's 'time' uniform memory location
	program.uTime = gl.getUniformLocation(program, "time");
	//get program's 'resolution' uniform memory location
	program.uResolution = gl.getUniformLocation(program, "resolution");

	//enable vertex position data
    gl.enableVertexAttribArray(program.aPositionLoc);

    //upload initial uniforms
    gl.useProgram(program);
    gl.uniform1f(program.uTime, this.time);
    gl.uniform2f(program.uResolution, this.width(), this.height());

    this.shadersNeedCompile = false;
}