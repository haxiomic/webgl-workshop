/* ---- Settings ---- */
var recompileInterval = 300;

/* ---- Editor ---- */
var inputChanged = true;

var editor = ace.edit('editor');
editor.setTheme('ace/theme/tomorrow_night');
editor.getSession().setMode('ace/mode/glsl');
editor.setShowPrintMargin(false);
editor.setFontSize(16);
editor.$blockScrolling = Infinity;
editor.focus();
editor.on('change', function(e){
	inputChanged = true;
});

editor.renderer.container.aceEditor = editor;

//load shader from local storage
var localStorageShader = loadShader();
if(localStorageShader){
	editor.setValue(localStorageShader, 1);
	editor.focus();
} 

/* ---- Preview ---- */
var canvas = document.querySelector('canvas#preview');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

var shaderPreview = new ShaderPreview(canvas);

window.addEventListener('resize', function(e){
	var isFS = (
		(document.fullscreenElement && document.fullscreenElement !== null) ||
		document.mozFullScreen ||
		document.webkitIsFullScreen ||
		(window.innerWidth == screen.width && window.innerHeight == screen.height)
	);

	document.body.classList.toggle('fullscreen', isFS);

	shaderPreview.setSize(
		window.innerWidth * (!isFS ? 0.5 : 1.0),
		window.innerHeight
	);
});

UI.onRestartClicked = function(){
	shaderPreview.time = 0;
}

var errorMarkers = [];

shaderPreview.addEventListener(ShaderPreview.SHADER_ERROR, function(data){
	var touchedLines = [];
	var uiMessages = [];

	for(var i = 0; i < data.errors.length; i++){
		var error = data.errors[i];
		uiMessages.push('<b>Line '+error.line+'</b>&nbsp; '+error.msg);

		if(error.line < 0) continue;

		if(touchedLines.indexOf(error.line) === -1){
			//annotate with error
			editor.getSession().setAnnotations([{
				row: error.line - 1,
				column: error.column,
				text: error.msg,
				type: "error"
			}]);

			//highlight line
			var hl = editor.getSession().highlightLines(error.line-1, error.line-1, 'ace_error-line', false);
			errorMarkers.push(hl.id);
		}

		touchedLines.push(error.line);
	}

	UI.setMessages(uiMessages, 'failure');
	uiMessages.length > 0 ? UI.showMessages() : null;
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

	UI.hideMessages();

	shaderPreview.setPixelShader(editor.getValue());
	
	var compileSuccess = shaderPreview._compileShaders();

	UI.setEditorStatus(compileSuccess === true ? 'success' : 'failure');
	if(compileSuccess === true){
		UI.setMessages(null, 'success');
		saveShader();
	}
}

function loadShader(){
	return localStorage.getItem('fragment-shader');
}

function saveShader(){
	localStorage.setItem('fragment-shader', editor.getValue());
}

compileShader();