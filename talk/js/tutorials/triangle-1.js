/*

	Simple triangle webgl demo

*/

DEMO.Triangle1 = DEMO.Demo.extend(function(canvas){
	DEMO.Triangle1.parent.call(this, canvas);//super

	//set the canvas attribute dimensions (not just the style dimensions)
	this.setSize(this.width(), this.height());

	var gl = this.canvas.getContext('webgl');


	/* ---- Create Shaders ---- */
	//the do nothing geometry shader
	var geometryShaderSrc = [
		'attribute vec2 position;',
		'varying vec2 uv;',
		'void main(){',
			'uv = (position.xy + vec2(1.0))*.5; //converts from clip space to graph space',
			'gl_Position = vec4(position, 0.0, 1.0);',
		'}'
	].join('\n');

	//simple gradient fragment shader
	var pixelShaderSrc = [
		'precision mediump float;',
		'varying vec2 uv;',
		'void main(void){',
			'gl_FragColor = vec4(uv.x, uv.y, 0.0, 1.0);',
		'}'
	].join('\n');

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


	/* ---- Draw! ---- */
	gl.useProgram(program);

	//set the vertices as the active geometry
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

	//tell the GPU about the format of the vertices
	var attribPositionLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(attribPositionLoc);
    gl.vertexAttribPointer(attribPositionLoc, vertices.elementsPerVertex, gl.FLOAT, false, 0, 0);

    //set the draw region and dimension
    gl.viewport(0, 0, this.width(), this.height());

    //draw triangle geometry
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / vertices.elementsPerVertex);
});