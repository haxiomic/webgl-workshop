var ShaderPreview = DEMO.CanvasShader.extend(function(canvas){
	//super
	ShaderPreview.parent.call(this, canvas, null);

	//find line count in shader header
	this.lineOffset = -this.pixelShaderHeader.match(/\n/ig).length;

	this.start();
});

ShaderPreview.SHADER_ERROR = 'shader-error';

ShaderPreview.prototype._compileShaders = function(){
	try{
		//super
		ShaderPreview.parent.prototype._compileShaders.call(this);
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
		}
	}
}

/* ---- Settings ---- */
var recompileInterval = 300;

/* ---- Editor ---- */
var inputChanged = true;

var editor = ace.edit('editor');
editor.setTheme('ace/theme/tomorrow_night');
editor.getSession().setMode('ace/mode/glsl');
editor.setShowPrintMargin(false);
editor.setFontSize(15);
editor.$blockScrolling = Infinity;
editor.focus();
editor.on('change', function(e){
	inputChanged = true;
});

/* ---- Preview ---- */
var canvas = document.querySelector('canvas#preview');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

var shaderPreview = new ShaderPreview(canvas);
window.addEventListener('resize', function(e){
	shaderPreview.setSize(window.innerWidth * .5, window.innerHeight);
});

var errorMarkers = [];

shaderPreview.addEventListener(ShaderPreview.SHADER_ERROR, function(data){
	var touchedLines = [];

	for(var i = 0; i < data.errors.length; i++){
		var error = data.errors[i];

		console.log('adding error', error.msg)

		if(error.line < 0) continue;

		editor.getSession().setAnnotations([{
			row: error.line - 1,
			column: error.column,
			text: error.msg,
			type: "error"
		}]);

		//add line marker if line doesn't already have one
		if(touchedLines.indexOf(error.line) === -1){
			var hl = editor.getSession().highlightLines(error.line-1, error.line-1, 'error-line', false);
			errorMarkers.push(hl.id);
		}

		touchedLines.push(error.line);
	}
});

//check for recompile loop
var recompileLoop = setInterval(function(){
	if(inputChanged){
		compileShader();
		inputChanged = false;
	}
}, recompileInterval);

function compileShader(){
	//clear any errors on editor
	var s = editor.getSession();
	s.setAnnotations([]);

	while(errorMarkers.length > 0){
		s.removeMarker(errorMarkers.pop());
	}

	shaderPreview.setPixelShader(editor.getValue());
	shaderPreview._compileShaders();
}

compileShader();