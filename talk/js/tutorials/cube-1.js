/*

	Illuminated cube webgl demo

*/

DEMO.Cube1 = DEMO.Demo.extend(function(canvas){
	DEMO.Cube1.parent.call(this, canvas);//super

	//set the canvas attribute dimensions (not just the style dimensions)
	this.canvas.width = this.width();
	this.canvas.height = this.height();

	var gl = this.canvas.getContext('webgl', {
		antialias: true
	});

	this.gl = gl;

	this.shadersNeedCompile = true;

	//webgl settings
	gl.clearColor(0, 0, 0, 1);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL); 
	gl.enable(gl.CULL_FACE); 

	/* ---- Create Shaders ---- */
	//the do nothing geometry shader
	this.geometryShaderSrc = [
		'precision mediump float;',

		'#define PI 3.14159265359',

		'attribute vec3 aPosition;',
		'attribute vec3 aNormal;',
		'attribute vec2 aUV;',

		'uniform float time;',
		'uniform vec2 resolution;',

		'varying vec4 pos;',
		'varying vec3 transformedNormal;',
		'varying vec2 uv;',

		'void main(){',
			'vec3 p = aPosition;',

			'uv = aUV;',

			'float invAspect = resolution.y / resolution.x;',

			'const float fov = 120.0;',
			'const float near = 0.01;',
			'const float far = 100.0;',

			//camera perspective transformation matrix
			'float f = 1.0 / tan(PI*.5 - .5 * radians(fov));',
			'const float invRange = 1.0 / (near - far);',
			'mat4 projectionMatrix = mat4(',
			'   f * invAspect , 0 , 0                         , 0  , ',
			'   0             , f , 0                         , 0  , ',
			'   0             , 0 , (far + near) * invRange   , -1 , ',
			'   0             , 0 , 2.0*(near*far) * invRange , 0',
			');',

			//view transformation matrix (model coords to world coords)
			//this is the position of the camera
			'vec3 t = vec3(0.0, 0.0, -4.0);',//translation
			'float s = 1.0;',//scale

			'mat4 viewMatrix = mat4(',
			'	s   , 0   , 0   , 0,',
			'	0   , s   , 0   , 0,',
			'	0   , 0   , s   , 0,',
			'	t.x , t.y , t.z , 1',
			');',

			//model transformation matrix (model's intrinsic transformation)
			//construct model transformation by rotations in X Y and Z

			//tumble in time
			'float ay = .25 * time;',
			'float ax = .50 * time;',
			'float az = .25 * time;',

			'mat4 rotX = mat4(',
			'	1 , 0        , 0       , 0 ,',
			'	0 , cos(ax)  , sin(ax) , 0 ,',
			'	0 , -sin(ax) , cos(ax) , 0 ,',
			'	0 , 0        , 0       , 1',
			');',

			'mat4 rotY = mat4(',
			'	cos(ay) , 0 , -sin(ay) , 0  , ',
			'	0       , 1 , 0        , 0  , ',
			'	sin(ay) , 0 , cos(ay)  , 0  , ',
			'	0       , 0 , 0        , 1',
			');',

			'mat4 rotZ = mat4(',
			'	cos(az)  , sin(az) , 0 , 0 ,',
			'	-sin(az) , cos(az) , 0 , 0 ,',
			'	0        , 0       , 1 , 0 ,',
			'	0        , 0       , 0 , 1',
			');',

			'mat4 modelRotationMatrix = rotX * rotY * rotZ;',
			'mat4 modelMatrix = modelRotationMatrix;',

			//position in view-space
			'pos = viewMatrix * modelMatrix * vec4(p, 1.0);',

			//transform the models normal matrix
			'transformedNormal = (modelRotationMatrix * vec4(aNormal, 1.0)).xyz;',
			
			'gl_Position = projectionMatrix * pos;',
		'}'
	].join('\n');

	//simple gradient fragment shader
	this.pixelShaderSrc = [
		'precision mediump float;',

		'uniform float time;',
		'#define time 0.4',

		'uniform vec2 resolution;',
		'uniform vec3 lightPos;',
		'uniform vec3 lightCol;',

		'varying vec2 uv;',
		'varying vec4 pos;',
		'varying vec3 transformedNormal;',

		'void main(){',
		'	vec3 col = vec3(0);',

		'	float r = distance(uv, vec2(.5));',
		'	col.r = pow(sin(time + r), 4.);',
		'	col.g = cos(time + uv.y + r)*.5 + .5;',
		'	col.b = (sin(time * 2.0)*.5 + .5);',

		'	vec3 rayDir = pos.xyz;',
		'	vec3 rayReflected = reflect(rayDir, transformedNormal);',

		//reflection lighting
		'float L, D, F, Lf, Ff;',

		'	L = max(dot(normalize(rayReflected), normalize(lightPos)), 0.0);',
		'	D = distance(pos.xyz, lightPos);',
		'	F = 5.0 * pow(L, 1.) / (D * D);',

		//plane illumination
		'	Lf = max(dot(transformedNormal, normalize(lightPos)), 0.0);',
		'	Ff = 15.0 * Lf / (D * D);',

		//ambient
		'	vec3 ambient = vec3(0.1);',

		'	gl_FragColor = vec4(col * ambient + lightCol*(F*1.0 + F*col*1.0) + lightCol*col*Ff, 1.0);',
		'}'
	].join('\n');

	this._compileShaders(this.geometryShaderSrc, this.pixelShaderSrc);

	/* ---- Upload Geometry ---- */
	//Geometry from https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Creating_3D_objects_using_WebGL

	var vertices = [
		// Front face
		-1.0, -1.0,  1.0,
		 1.0, -1.0,  1.0,
		 1.0,  1.0,  1.0,
		-1.0,  1.0,  1.0,
		
		// Back face
		-1.0, -1.0, -1.0,
		-1.0,  1.0, -1.0,
		 1.0,  1.0, -1.0,
		 1.0, -1.0, -1.0,
		
		// Top face
		-1.0,  1.0, -1.0,
		-1.0,  1.0,  1.0,
		 1.0,  1.0,  1.0,
		 1.0,  1.0, -1.0,
		
		// Bottom face
		-1.0, -1.0, -1.0,
		 1.0, -1.0, -1.0,
		 1.0, -1.0,  1.0,
		-1.0, -1.0,  1.0,
		
		// Right face
		 1.0, -1.0, -1.0,
		 1.0,  1.0, -1.0,
		 1.0,  1.0,  1.0,
		 1.0, -1.0,  1.0,
		
		// Left face
		-1.0, -1.0, -1.0,
		-1.0, -1.0,  1.0,
		-1.0,  1.0,  1.0,
		-1.0,  1.0, -1.0
	];

	vertices.elementsPerVertex = 3;

	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	this.vertexBuffer = vertexBuffer;

	//This array defines each face as two triangles, using the
	//indices into the vertex array to specify each triangle's
	//position.
	var indices = [
		0,  1,  2,      0,  2,  3,    // front
		4,  5,  6,      4,  6,  7,    // back
		8,  9,  10,     8,  10, 11,   // top
		12, 13, 14,     12, 14, 15,   // bottom
		16, 17, 18,     16, 18, 19,   // right
		20, 21, 22,     20, 22, 23    // left
	];

	var indicesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	this.indicesBuffer = indicesBuffer;

	//extra data on buffer object (bad practice but fine for now)
	indicesBuffer.indiceCount = indices.length;

	//normals
	var vertexNormals = [
		// Front
		 0.0,  0.0,  1.0,
		 0.0,  0.0,  1.0,
		 0.0,  0.0,  1.0,
		 0.0,  0.0,  1.0,
		
		// Back
		 0.0,  0.0, -1.0,
		 0.0,  0.0, -1.0,
		 0.0,  0.0, -1.0,
		 0.0,  0.0, -1.0,
		
		// Top
		 0.0,  1.0,  0.0,
		 0.0,  1.0,  0.0,
		 0.0,  1.0,  0.0,
		 0.0,  1.0,  0.0,
		
		// Bottom
		 0.0, -1.0,  0.0,
		 0.0, -1.0,  0.0,
		 0.0, -1.0,  0.0,
		 0.0, -1.0,  0.0,
		
		// Right
		 1.0,  0.0,  0.0,
		 1.0,  0.0,  0.0,
		 1.0,  0.0,  0.0,
		 1.0,  0.0,  0.0,
		
		// Left
		-1.0,  0.0,  0.0,
		-1.0,  0.0,  0.0,
		-1.0,  0.0,  0.0,
		-1.0,  0.0,  0.0
	];

	var normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
	this.normalBuffer = normalBuffer;

	//UVs
	var uv = [
	  // Front
	  0.0,  0.0,
	  1.0,  0.0,
	  1.0,  1.0,
	  0.0,  1.0,
	  // Back
	  0.0,  0.0,
	  1.0,  0.0,
	  1.0,  1.0,
	  0.0,  1.0,
	  // Top
	  0.0,  0.0,
	  1.0,  0.0,
	  1.0,  1.0,
	  0.0,  1.0,
	  // Bottom
	  0.0,  0.0,
	  1.0,  0.0,
	  1.0,  1.0,
	  0.0,  1.0,
	  // Right
	  0.0,  0.0,
	  1.0,  0.0,
	  1.0,  1.0,
	  0.0,  1.0,
	  // Left
	  0.0,  0.0,
	  1.0,  0.0,
	  1.0,  1.0,
	  0.0,  1.0
	];

	var uvBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
	this.uvBuffer = uvBuffer;
});

DEMO.Cube1.prototype.render = function(dt){
	//recompile shaders if necessary
	if(this.shadersNeedCompile === true){
		this._compileShaders(this.geometryShaderSrc, this.pixelShaderSrc);
	}

	var gl = this.gl;
	var program = this.program;
	var vertexBuffer = this.vertexBuffer;
	var indicesBuffer = this.indicesBuffer;
	var normalBuffer = this.normalBuffer;
	var uvBuffer = this.uvBuffer;

	/* ---- Draw! ---- */
	gl.useProgram(program);

	//set the vertices as the active geometry
	//enable vertex position data
	gl.enableVertexAttribArray(program.aPositionLoc);
	gl.enableVertexAttribArray(program.aNormalLoc);
	gl.enableVertexAttribArray(program.aUVLoc);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(program.aPositionLoc, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.vertexAttribPointer(program.aNormalLoc, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
	gl.vertexAttribPointer(program.aUVLoc, 2, gl.FLOAT, false, 0, 0);


    //upload the time variable
    gl.uniform1f(program.uTime, this.time);

	//set the draw region and dimension
	gl.viewport(0, 0, this.width(), this.height());

	//clear canvas from last draw
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	//draw triangle geometry
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
	gl.drawElements(gl.TRIANGLES, indicesBuffer.indiceCount, gl.UNSIGNED_SHORT, 0);
}

DEMO.Cube1.prototype.setSize = function(w, h){
	this.canvas.width = w;
	this.canvas.height = h;
	//update resolution uniform
    this.gl.useProgram(this.program);
	this.gl.uniform2f(this.program.uResolution, this.width(), this.height());
}

DEMO.Cube1.prototype.setPixelShader = function(pixelShaderSrc){
	this.pixelShaderSrc = pixelShaderSrc;
	this.shadersNeedCompile = true;
}

DEMO.Cube1.prototype.setGeometryShader = function(geometryShaderSrc){
	this.geometryShaderSrc = geometryShaderSrc;
	this.shadersNeedCompile = true;
}

DEMO.Cube1.prototype._compileShaders = function(geometryShaderSrc, pixelShaderSrc){
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
	program.aPositionLoc = gl.getAttribLocation(program, "aPosition");
	program.aNormalLoc = gl.getAttribLocation(program, "aNormal");
	program.aUVLoc = gl.getAttribLocation(program, "aUV");
	//get program's 'time' uniform memory location
	program.uTime = gl.getUniformLocation(program, "time");
	//get program's 'resolution' uniform memory location
	program.uResolution = gl.getUniformLocation(program, "resolution");
	program.uLightPos = gl.getUniformLocation(program, "lightPos");
	program.uLightCol = gl.getUniformLocation(program, "lightCol");

    //upload initial uniforms
    gl.useProgram(program);
    gl.uniform1f(program.uTime, this.time);
    gl.uniform2f(program.uResolution, this.width(), this.height());
    gl.uniform3f(program.uLightPos, 0.0, 0.0, 1.0);
    gl.uniform3f(program.uLightCol, 1.0, 1.0, 1.0);

    this.shadersNeedCompile = false;
}