var ShaderPreview = DEMO.CanvasShader.extend(function(canvas){
	//super
	ShaderPreview.parent.call(this, canvas, null);

	this.pixelShaderHeader += [
		'varying vec2 r;',
		'uniform vec3 mouse;',

		'#define PI 3.14159265359',

		//angle from 0 -> 2PI
		'float angle(vec2 p, vec2 o){',
			'vec2 _p = p - o;',
			'if(_p.y > 0.0) return atan(_p.y, _p.x)/(2.0*PI);',
			'return -atan(_p.y, -_p.x)/(2.0*PI) + 0.5;',
		'}',

		'float angle(vec2 p){',
			'return angle(p, vec2(0));',
		'}',

		'float angle(){',
			'return angle(r);',
		'}',

		'float rand(vec2 co){',
		    'return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);',
		'}',

		''
	].join('\n');

	this.geometryShaderSrc = [
		'precision mediump float;',

		'attribute vec2 position;',
		'uniform vec2 resolution;',
		'varying vec2 uv;',
		'varying vec2 r;',

		'#define PI 3.14159265359',

		'void main(){',
			'uv = (position.xy + vec2(1.0))*.5; //converts from clip space to graph space',

			//fit to viewport
			'float aspect = resolution.x/resolution.y;',
			'r = (uv - vec2(0.5)) * (aspect > 1.0 ? vec2(aspect, 1.0) : vec2(1.0, 1.0/aspect) ) ;',

			'gl_Position = vec4(position, .0, 1.0);',
		'}'
	].join('\n');

	//find line count in shader header
	this.lineOffset = -this.pixelShaderHeader.match(/\n/ig).length;

	this.start();
});

ShaderPreview.SHADER_ERROR = 'shader-error';

ShaderPreview.prototype.render = function(dt){
	var gl = this.gl;
	var program = this.program;

	if(!program) return;

	gl.useProgram(program);
	//set mouse uniform if is down
	gl.uniform3f(program.uMouse, this.mouse.x / this.width(), this.mouse.y / this.height(), this.mouseDown ? 1.0 : 0.0);

	//super
	ShaderPreview.parent.prototype.render.call(this, dt);
}

ShaderPreview.prototype._compileShaders = function(){
	try{
		//super
		ShaderPreview.parent.prototype._compileShaders.call(this);

		this.program.uMouse = this.gl.getUniformLocation(this.program, 'mouse');

		return true;
	}catch(e){
		//process errors
		switch(e.type){
			case 'fs':
			case 'vs':
			var errorReg = /^\s*[A-Z]+:\s*(\d+)\s*:\s*(\d+)\s*:\s*([^\n]+)/igm;

			//collect errors with regex on msg
			var errors = [];

			while(true){
				var line = -1, column = -1, msg = 'unknown error';
				var result = errorReg.exec(e.msg);
				if(!result) break;

				if(result){
					column = parseInt(result[1]);
					line = parseInt(result[2]) + this.lineOffset;
					msg = result[3].trim();
				}else{
					msg = e.msg;
				}

				errors.push({
					line: line,
					column: column,
					msg: msg
				})
			}

			this.dispatch(ShaderPreview.SHADER_ERROR, {
				errors: errors,
				original: e
			});
			break;
			default:
			console.log('unknown error: ', e);
		}
		return false;
	}
}