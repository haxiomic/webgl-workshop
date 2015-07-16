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
		}
		return false;
	}
}