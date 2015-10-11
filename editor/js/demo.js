/*
	demo.js v0.5

	- handy utility for quickly creating WebGL demos

	@author George Corney (haxiomic)
*/

var DEMO = {};


/*
	Demo

	base class for demos
*/
DEMO.Demo = function(canvas){
	//private
	var _initSysTime = Date.now()/1000;
	var _lastGlobalTime = 0;
	var mainLoop = (function(){
		this.globalTime = Date.now()/1000 - _initSysTime;
		var dt = this.globalTime - _lastGlobalTime;
		_lastGlobalTime = this.globalTime;

		if(this.running){
			this.time += dt;

			this.update(this.time, dt);
			this.render(dt);
		}

		requestAnimationFrame(mainLoop);
	}).bind(this);

	//mouse handling
	this.canvas = canvas;
	this.running = false;
	this.globalTime = 0;
	this.time = 0;
	this.mouseDown = false;
	this.mouse = {
		x:0,
		y:0
	}
	this._mainLoop = mainLoop;

	this.canvas.addEventListener('mousedown', (function(e){
		this.mouseDown = true;
		this.mouse.x = e.layerX;
		this.mouse.y = e.layerY;
		this.onMouseDown(e);
	}).bind(this));

	this.canvas.addEventListener('mouseup', (function(e){
		this.mouseDown = false;
		this.mouse.x = e.layerX;
		this.mouse.y = e.layerY;
		this.onMouseUp(e);
	}).bind(this));

	this.canvas.addEventListener('mousemove', (function(e){
		this.mouse.x = e.layerX;
		this.mouse.y = e.layerY;
		this.onMouseMove(e);
	}).bind(this));

	this.canvas.addEventListener('mouseleave', (function(e){
		this.mouseDown = false;
	}).bind(this));
}

DEMO.Demo.extend = function(constructor){
	var cClass = this;
	var obj = constructor;
	obj.prototype = Object.create(cClass.prototype);
	obj.prototype.constructor = obj;

	obj.parent = cClass;
	obj.extend = cClass.extend;
	return obj;
}

DEMO.Demo.prototype.constructor = DEMO.Demo;

DEMO.Demo.prototype.start = function(){
	if(this.running) return;
	this.running = true;
	this._mainLoop();
	this.dispatch('start', this);
}

DEMO.Demo.prototype.stop = function(){
	this.running = false;
	this.dispatch('stop', this);
}

DEMO.Demo.prototype.update = function(time, dt){}

DEMO.Demo.prototype.render = function(dt){}

DEMO.Demo.prototype.setSize = function(width, height){
	this.canvas.width = width;
	this.canvas.height = height;
}

DEMO.Demo.prototype.width = function(){
	return this.canvas.clientWidth;
}

DEMO.Demo.prototype.height = function(){
	return this.canvas.clientHeight;
}

DEMO.Demo.prototype.onMouseDown = function(e){}
DEMO.Demo.prototype.onMouseUp = function(e){}
DEMO.Demo.prototype.onMouseMove = function(e){}
DEMO.Demo.prototype.onMouseLeave = function(e){}

DEMO.Demo.prototype.listeners = {};//{ name: [callbacks] }

DEMO.Demo.prototype.addEventListener = function(eventName, callback){
	if(!this.listeners[eventName])
		this.listeners[eventName] = [];

	this.listeners[eventName].push(callback);
}

DEMO.Demo.prototype.removeEventListener = function(eventName, callback){
	if(!this.listeners[eventName]){
		while(true){
			var cbi = this.listeners[eventName].indexOf(callback);
			if(cbi < 0) break;
			this.listeners[eventName].splice(cbi, 1);
		}
	}
}

DEMO.Demo.prototype.dispatch = function(eventName, data){
	var callbacks = this.listeners[eventName];
	if(callbacks){
		for(var i = 0; i < callbacks.length; i++){
			callbacks[i](data);
		}
	}
}

/*
	CanvasShader
	
	for canvas-covering pixel shaders
*/
DEMO.CanvasShader = DEMO.Demo.extend(function(canvas, fragmentShader){
	DEMO.CanvasShader.parent.call(this, canvas);//super

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
	this.vertexShaderSrc = [
		'precision mediump float;',

		'attribute vec2 position;',
		'varying vec2 uv;',

		'void main(){',
			'uv = (position.xy + vec2(1.0))*.5; //converts from clip space to graph space',
			
			'gl_Position = vec4(position, .0, 1.0);',
		'}'
	].join('\n');

	//simple gradient fragment shader
	this.pixelShaderHeader = [
		'precision mediump float;',

		'uniform float time;',
		'uniform vec2 resolution;',

		'varying vec2 uv;',
		''
	].join('\n');

	this.pixelShaderSrc = this.pixelShaderHeader + (!fragmentShader ? [
		'void main(){',
		'	vec3 col = vec3(0);',

		'	gl_FragColor = vec4(uv, 0.0, 1.0);',
		'}'
	].join('\n') : fragmentShader);

	/* ---- Upload Geometry ---- */
	var vertices = [
		-1,  1,   //  0---2
		-1, -1,   //  |  /|
		 1,  1,   //  | / |
		 1, -1,   //  1---3
	]	

	vertices.elementsPerVertex = 2;
	vertices.vertexCount = vertices.length/vertices.elementsPerVertex;
	this.vertices = vertices;

	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	this.vertexBuffer = vertexBuffer;
});

DEMO.CanvasShader.prototype.render = function(dt){
	//recompile shaders if necessary
	if(this.shadersNeedCompile === true){
		this._compileShaders();
	}

	var gl = this.gl;
	var program = this.program;
	var vertexBuffer = this.vertexBuffer;
	var vertices = this.vertices;

	/* ---- Draw! ---- */
	gl.useProgram(program);
	//set the vertices as the active geometry
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	//tell the GPU about the format of the vertices
	gl.vertexAttribPointer(program.aPositionLoc, vertices.elementsPerVertex, gl.FLOAT, false, 0, 0);
	//upload the time variable
	gl.uniform1f(program.uTime, this.time);
	//set the draw region and dimension
	gl.viewport(0, 0, this.width(), this.height());
	//clear canvas from last draw
	gl.clear(gl.COLOR_BUFFER_BIT);
	//draw triangle geometry
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.vertexCount);
}

DEMO.CanvasShader.prototype.setSize = function(w, h){
	this.canvas.width = w;
	this.canvas.height = h;
	//update resolution uniform
	this.gl.useProgram(this.program);
	this.gl.uniform2f(this.program.uResolution, this.width(), this.height());
}

DEMO.CanvasShader.prototype.setPixelShader = function(pixelShaderSrc){
	this.pixelShaderSrc = this.pixelShaderHeader + pixelShaderSrc;
	this.shadersNeedCompile = true;
}

DEMO.CanvasShader.prototype.setVertexShader = function(vertexShaderSrc){
	this.vertexShaderSrc = vertexShaderSrc;
	this.shadersNeedCompile = true;
}

DEMO.CanvasShader.prototype._compileShaders = function(){
	var gl = this.gl;
	var vertexShaderSrc = this.vertexShaderSrc;
	var pixelShaderSrc = this.pixelShaderSrc;

	this.shadersNeedCompile = false;

	//remove any old programs
	if(this.program){
		gl.deleteProgram(this.program);
	}

	//create and compile
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderSrc);
	gl.compileShader(vertexShader);

	var pixelShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(pixelShader, pixelShaderSrc);
	gl.compileShader(pixelShader);

	//check for compilation errors
	if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
		throw {
			type: 'vs',
			msg: gl.getShaderInfoLog(vertexShader)
		};
	}

	if(!gl.getShaderParameter(pixelShader, gl.COMPILE_STATUS)){
		throw {
			type: 'fs',
			msg: gl.getShaderInfoLog(pixelShader)
		};
	}

	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, pixelShader);
	gl.linkProgram(program);
	this.program = program;

	if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
		//cleanup shaders
		gl.detachShader(program, vertexShader);
		gl.detachShader(program, pixelShader);
		gl.deleteShader(vertexShader);
		gl.deleteShader(pixelShader);
		throw {
			type: 'link',
			msg: gl.getProgramInfoLog(program)
		};
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
}



//Utils
DEMO.utils = {};

DEMO.utils.ScreenTexture = function(renderer){
	this.renderer = renderer;
	this.camera = new THREE.OrthographicCamera();
	this.scene = new THREE.Scene();

	this.utexture = {
		type: 't',
		value: null
	};

	this.screenShaderMat = new THREE.ShaderMaterial({
		//pass through
		vertexShader: DEMO.shaders.vertex.passThrough,
		fragmentShader: DEMO.shaders.fragment.basicTexture,
		uniforms: {
			texture: this.utexture
		},
		transparent: true
	});

	this.shaderPlane = new THREE.Mesh(
		new THREE.PlaneBufferGeometry(2, 2),
		this.screenShaderMat
	);

	this.scene.add(this.shaderPlane);
}

DEMO.utils.ScreenTexture.prototype.constructor = DEMO.utils.ScreenRender;

DEMO.utils.ScreenTexture.prototype.render = function(texture){
	this.utexture.value = texture;
	this.renderer.render(this.scene, this.camera);
}

//Shaders
DEMO.shaders = {};
DEMO.shaders.vertex = {};
DEMO.shaders.fragment = {};

//vertex
DEMO.shaders.vertex.passThrough = [
	'varying vec2 uvp;',
	'void main(void){',
		'uvp = (position.xy + vec2(1.0))*.5;',
		'gl_Position = vec4(position, 1.0);',
	'}'
].join('\n');

//fragment
DEMO.shaders.fragment.basicTexture = [
	'uniform sampler2D texture;',
	'varying vec2 uvp;',
	'void main(void){',
		'gl_FragColor = texture2D(texture, uvp);',
	'}'
].join('\n');

//Data
DEMO.data = {};