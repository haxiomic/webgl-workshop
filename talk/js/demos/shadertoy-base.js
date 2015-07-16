/*
	Shader Inputs
	uniform vec3      iResolution;           // viewport resolution (in pixels)
	uniform float     iGlobalTime;           // shader playback time (in seconds)
	uniform float     iChannelTime[4];       // channel playback time (in seconds)
	uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)
	uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
	uniform samplerXX iChannel0..3;          // input channel. XX = 2D/Cube
	uniform vec4      iDate;                 // (year, month, day, time in seconds)
	uniform float     iSampleRate;  
*/

DEMO.ShadertoyBase = DEMO.ScreenShader.extend(function(canvas, fragmentShader, scale){
	//prepend glsl
	fragmentShader = [
		'',
		'uniform vec3 iResolution;',
		'uniform float iGlobalTime;',
		'uniform vec4 iMouse;',

		'uniform vec2 iResolutionDelta;',
		''
	].join('\n') + fragmentShader;

	//append glsl
	fragmentShader += [
		'',
		'void main(){',
		'	mainImage(gl_FragColor, gl_FragCoord.xy * iResolutionDelta);',
		'	uvp;',//prevent unused errors
		'}'
	].join('\n');

	//super
	DEMO.ShadertoyBase.parent.call(this, canvas, fragmentShader, scale);

	//add in Shadertoy uniforms
	this.uniforms.iResolution = {
		type: 'v3',
		value: new THREE.Vector3(this.width()*this.scale, this.height()*this.scale, window.devicePixelRatio)
	};
	this.uniforms.iGlobalTime = this.uniforms.time;
	this.uniforms.iMouse = {
		type: 'v4',
		value: new THREE.Vector4()
	};

	//additional resolution fixing uniform
	//when gl_FragCoord is out of sync with display because render target is different size
	this.uniforms.iResolutionDelta = {
		type: 'v2',
		value: new THREE.Vector2(1., 1.)
	};

	//@! todo
	// - iMouse
	// - iChannels
	// - iDate
	// - iSampleRate
	// - iChannelTime
	// - iChannelResolution
});

DEMO.ShadertoyBase.prototype.setSize = function(w, h){
	this.uniforms.iResolutionDelta.value.set(w*this.scale/this.scaledRenderTarget.width, h*this.scale/this.scaledRenderTarget.height);
	this.uniforms.iResolution.value.set(w*this.scale, h*this.scale);

	DEMO.ScreenShader.prototype.setSize.call(this, w, h);
}

DEMO.ShadertoyBase.prototype.onMouseDown = function(e){
	this.uniforms.iMouse.value.x = this.mouse.x;
	this.uniforms.iMouse.value.y = this.mouse.y;
	this.uniforms.iMouse.value.z = this.uniforms.iMouse.value.w = 1.0;
}

DEMO.ShadertoyBase.prototype.onMouseUp = function(e){
	this.uniforms.iMouse.value.x = this.mouse.x;
	this.uniforms.iMouse.value.y = this.mouse.y;
	this.uniforms.iMouse.value.z = this.uniforms.iMouse.value.w = 0.0;
}

DEMO.ShadertoyBase.prototype.onMouseMove = function(e){
	if(this.mouseDown){
		this.uniforms.iMouse.value.x = this.mouse.x;
		this.uniforms.iMouse.value.y = this.mouse.y;
	}
}