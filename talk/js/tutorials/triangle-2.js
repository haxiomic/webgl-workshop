/*

	Simple triangle webgl demo, v2

*/

DEMO.Triangle2 = DEMO.Demo.extend(function(canvas){
	DEMO.Triangle2.parent.call(this, canvas);//super

	//set the canvas attribute dimensions (not just the style dimensions)
	this.canvas.width = this.width();
	this.canvas.height = this.height();

	var gl = this.canvas.getContext('webgl');
	this.gl = gl;

	this.shadersNeedCompile = true;

	//webgl settings
	gl.clearColor(1, 1, 1, 1);

	/* ---- Create Shaders ---- */
	//the do nothing geometry shader
	this.geometryShaderSrc = [
		'precision mediump float;',

		'attribute vec2 position;',
		'uniform float time;',
		'varying vec2 uv;',
		'void main(){',
			'vec2 p = position.xy;',

			'uv = (p + vec2(1.0))*.5; //converts from clip space to graph space',

			'gl_Position = vec4(p, 0.0, 1.0);',
		'}'
	].join('\n');

	//simple gradient fragment shader
	this.pixelShaderSrc = [
		'precision mediump float;',

		'uniform float time;',
		'varying vec2 uv;',
		'void main(){',
		'	vec3 col = vec3(0);',
		'	col.r = sin(time + uv.x)*.5 + .5;',
		'	col.g = cos(time + uv.y)*.5 + .5;',
		'	col.b = sin(time * 2.0)*.5 + .5;',
		'	gl_FragColor = vec4(col, 1.0);',
		'}'
	].join('\n')

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

DEMO.Triangle2.prototype.render = function(dt){
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

DEMO.Triangle2.prototype.setPixelShader = function(pixelShaderSrc){
	this.pixelShaderSrc = pixelShaderSrc;
	this.shadersNeedCompile = true;
}

DEMO.Triangle2.prototype.setGeometryShader = function(geometryShaderSrc){
	this.geometryShaderSrc = geometryShaderSrc;
	this.shadersNeedCompile = true;
}

DEMO.Triangle2.prototype._compileShaders = function(geometryShaderSrc, pixelShaderSrc){
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

	//enable vertex position data
    gl.enableVertexAttribArray(program.aPositionLoc);

    //upload initial uniforms
    gl.useProgram(program);
    gl.uniform1f(program.uTime, this.time);

    this.shadersNeedCompile = false;
}