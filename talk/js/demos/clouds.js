/*
	Volumetric Clouds

	- requires THREE.Sky

	@author George Corney (haxiomic)
*/

'use strict';

DEMO.Clouds = DEMO.Demo.extend(function(canvas){
	//super
	DEMO.Clouds.parent.call(this, canvas);

	//private variables
	//settings
	var cloudRenderScale = .28;
	var fov = 75;
	var sunAltitude = 0.10;
	var sunAzimuth = 0.12;

	var shaders = this._shaders;

	//private functions
	var horizontalToCartesian = (function(altitude, azimuth){
		//compute sun position from alt and az
		var theta = Math.PI * (altitude - 0.5);
		var phi = 2 * Math.PI * (azimuth - 0.5);
		var distance = 1;

		var position = new THREE.Vector3();
		position.x = distance * Math.cos(phi);
		position.y = distance * Math.sin(phi) * Math.sin(theta);
		position.z = distance * Math.sin(phi) * Math.cos(theta);
		return position;
	}).bind(this);

	//
	this.startTime = -50;//-50;
	this.camMouse = {x:0, y:0};

	this.renderer = new THREE.WebGLRenderer({
		canvas: canvas,
		alpha: false,
		stencil: false,
		antialias: false,
		depth: true,
	});
	this.renderer.setClearColor(0x000000, 0);

	this.camera = new THREE.PerspectiveCamera(fov, this.getAspect(), 0.001, 2000000);
	this.cameraNormal = new THREE.Vector3(0,0,-1);

	this.screenTexture = new DEMO.utils.ScreenTexture(this.renderer);

	this.sunPosition = horizontalToCartesian(sunAltitude, sunAzimuth);

	//resources
	//load from base64 string
	var noiseImageNode = document.createElement('img');
	var noiseTexture = new THREE.Texture(noiseImageNode);
	noiseImageNode.onload = function(){noiseTexture.needsUpdate = true;};
	noiseImageNode.src = DEMO.data.noise256;

	// var noiseTexture = THREE.ImageUtils.loadTexture("images/noise.png");
	noiseTexture.magFilter = THREE.LinearFilter;
	noiseTexture.minFilter = THREE.LinearFilter;
	noiseTexture.wrapS = THREE.RepeatWrapping;
	noiseTexture.wrapT = THREE.RepeatWrapping;
	noiseTexture.generateMipmaps = false;
	noiseTexture.flipY = false;

	//render targets
	this.backfaceRT = new THREE.WebGLRenderTarget(this.width()*cloudRenderScale, this.height()*cloudRenderScale, {
		magFilter: THREE.NearestFilter,
		minFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.UnsignedByteType,
		depthBuffer: false,
		stencilBuffer: false,
		generateMipmaps: false
	});

	this.cloudsRT = new THREE.WebGLRenderTarget(this.width()*cloudRenderScale, this.height()*cloudRenderScale, {
		magFilter: THREE.LinearFilter,
		minFilter: THREE.LinearFilter,
		format: THREE.RGBAFormat,
		type: THREE.UnsignedByteType,
		depthBuffer: false,
		stencilBuffer: false,
		generateMipmaps: false
	});

	this.backfaceShaderMat = new THREE.ShaderMaterial({
		vertexShader: shaders.vertex.projectAndFlatten,
		fragmentShader: shaders.fragment.faceCoordinates,
		uniform: {
			cameraNormal: {
				type: "v3",
				value: this.cameraNormal
			}
		},
		side: THREE.BackSide,
		transparent: true
	});

	this.raymarchShaderMat = new THREE.ShaderMaterial({
		vertexShader: shaders.vertex.projectAndFlatten,
		fragmentShader: shaders.fragment.raymarchClouds,
		uniforms: {
			cameraNormal: {
				type: "v3",
				value: this.cameraNormal
			},
			backfaceInvResolution: {
				type: "v2",
				value: new THREE.Vector2(1/this.backfaceRT.width, 1/this.backfaceRT.height)
			},
			backfaceTexture: {
				type: "t",
				value: this.backfaceRT
			},
			noiseTexture: {
				type: "t",
				value: noiseTexture
			},
			sunPosition: {
				type: "v3",
				value: this.sunPosition
			},
			time: {
				type: "f",
				value: this.time
			}
		},
		transparent: true
	});

	//scenes
	this.scene = new THREE.Scene();
	this.cloudCube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), null);
	this.scene.add(this.cloudCube);

	this.skyScene = new THREE.Scene();
	var sky = new THREE.Sky();
	sky.uniforms.turbidity.value = 10;
	sky.uniforms.reileigh.value = 2;
	sky.uniforms.mieCoefficient.value = 0.005;
	sky.uniforms.mieDirectionalG.value = 0.8;
	sky.uniforms.luminance.value = 1;

	sky.uniforms.sunPosition.value = this.sunPosition;
	this.skyScene.add(sky.mesh);
});

DEMO.Clouds.prototype.update = function(time){
	//update time
	this.raymarchShaderMat.uniforms.time.value = time + this.startTime;

	//update camera
	var R = .707106781 * .5;

	if(this.mouseDown){
		this.camMouse.x = this.mouse.x;
		this.camMouse.y = this.mouse.y;
	}

	this.camera.position.set(
		Math.cos(time*0.1 + this.camMouse.x/this.width())*R*.3,
		-R + Math.sin(-this.camMouse.y/this.height())*.1,
		R
	);
	this.camera.lookAt(this.cloudCube.position);
	//roll
	this.camera.rotation.z = Math.sin(time * .1)*.5;

	//determine camera normal
	this.cameraNormal.set(0,0,-1);
	this.cameraNormal.applyQuaternion(this.camera.quaternion);
}

DEMO.Clouds.prototype.render = function(dt){
	this.renderer.setViewport (0, 0, this.backfaceRT.width, this.backfaceRT.height);

	//backface coordinates pass
	this.cloudCube.material = this.backfaceShaderMat;
	this.renderer.render(this.scene, this.camera, this.backfaceRT, false);

	//composite sky and clouds
	this.renderer.autoClearColor = false;

	//sky pass
	this.renderer.render(this.skyScene, this.camera, this.cloudsRT, false);

	//raytrace pass
	this.cloudCube.material = this.raymarchShaderMat;
	this.renderer.render(this.scene, this.camera, this.cloudsRT, false);

	this.renderer.autoClearColor = true;

	//render to screen pass
	this.renderer.setViewport (0, 0, this.width(), this.height());
	this.screenTexture.render(this.cloudsRT);
}

DEMO.Clouds.prototype.setSize = function(width, height){
	this.renderer.setSize(width, height);//alters canvas size

	this.camera.aspect = this.getAspect();
	this.camera.updateProjectionMatrix();
};

DEMO.Clouds.prototype.getAspect = function(){
	return this.width()/this.height();
}

//to convert shader strings to arrays:
//	https://jsfiddle.net/oudwmfo4/2/
DEMO.Clouds.prototype._shaders = {
	vertex: {
		projectAndFlatten: [
			'uniform vec3 cameraNormal;',
			'varying vec3 worldCoord;',

			'const float near = 0.001 * 1.01;',

			'void main(void){',
			'	//if position behind camera, flatten position to camera plane',
			'	vec3 p = position;',

			'	vec3 cameraToP = p - cameraPosition;',
			'	float d = dot(cameraToP, cameraNormal);',

			'	if(d < near){',
			'		p = p - (d - near) * cameraNormal;',
			'	}',

			'	worldCoord = p + 0.5;',
			'	gl_Position = (projectionMatrix * modelViewMatrix * vec4(p, 1.0));',
			'}'
		].join('\n')
	},

	fragment: {
		faceCoordinates: [
			'varying vec3 worldCoord;',
			'void main(void){',
			'	gl_FragColor = vec4(worldCoord, 1.);',
			'}'
		].join('\n'),
		
		raymarchClouds: [
			'	uniform vec2 backfaceInvResolution;',
			'	uniform sampler2D backfaceTexture;',
			'	uniform sampler2D noiseTexture;',

			'	uniform vec3 sunPosition;',
			'	uniform float time;',

			'	varying vec3 worldCoord;',

			'	const bool debugLOD = false;',
			'	const float transmittance = 2.8;//1.3',
			'	const float noiseScale = 2.;',
			'	const vec3 diffuseColor = vec3(255./255., 254./255., 240./255.);',
			'	const vec3 shadeColor = vec3(130./255., 130./255., 130./255.) * 1.8;',

			'	//iq\'s magic 3d texture noise',
			'	float noise( in vec3 x ){',
			'		vec3 p = floor(x);',
			'		vec3 f = fract(x);',
			'		f = f*f*(3.0-2.0*f);',
			'		',
			'		vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;',
			'		vec2 rg = texture2D( noiseTexture, (uv+ 0.5)/256.0, -100.0 ).yx;',
			'		return mix( rg.x, rg.y, f.z );',
			'	}',

			'	float map6(in vec3 p){',
			'		vec3 q = p;',
			'		float f;',
			'		f  = 0.5000*noise( q ); q = q*2.32;',
			'		f += 0.2500*noise( q ); q = q*2.31;',
			'		f += 0.12500*noise( q ); q = q*2.32;',
			'		f += 0.06250*noise( q ); q = q*2.21;',
			'		f += 0.03125*noise( q ); q = q*2.13;',
			'		f += 0.015625*noise( q );',
			'		return f * f * f * f;',
			'	}',

			'	float map5(in vec3 p){',
			'		vec3 q = p;',
			'		float f;',
			'		f  = 0.5000*noise( q ); q = q*2.02;',
			'		f += 0.2500*noise( q ); q = q*2.03;',
			'		f += 0.12500*noise( q ); q = q*2.01;',
			'		f += 0.06250*noise( q ); q = q*2.02;',
			'		f += 0.03125*noise( q );',
			'		return f * f * f * f;',
			'	}',

			'	float map4(in vec3 p){',
			'		vec3 q = p;',
			'		float f;',
			'		f  = 0.5000*noise( q ); q = q*2.02;',
			'		f += 0.2500*noise( q ); q = q*2.03;',
			'		f += 0.12500*noise( q ); q = q*2.01;',
			'		f += 0.06250*noise( q );',
			'		return f * f * f * f;',
			'	}',

			'	float map3(in vec3 p){',
			'		vec3 q = p;',
			'		float f;',
			'		f  = 0.5000*noise( q ); q = q*2.02;',
			'		f += 0.2500*noise( q ); q = q*2.03;',
			'		f += 0.12500*noise( q );',
			'		return f * f * f * f;',
			'	}',

			'	float map2(in vec3 p){',
			'		vec3 q = p;',
			'		float f;',
			'		f  = 0.5000*noise( q ); q = q*2.02;',
			'		f += 0.2500*noise( q );',
			'		return f * f * f * f;',
			'	}',

			'	vec4 raymarchTransmittance(in vec3 rayStart, in vec3 rayDir, in float maxLen){',
			'		float scd = distance(cameraPosition, rayStart);',

			'		float denMultiplier = 1.5;/*(sin(time * 0.2)*0.8 + 2.0)*.5*/;',
			'		const float denOffset = -0.12;',
			'		vec3 noiseOffset = vec3(0., time * .07, -time * .07);',


			'		float stepSize = 0.01;',
			'		float tm = 1.0;',
			'		float t = 0.;',

			'		vec3 col = vec3(0.0);',

			'		vec3 pos, uCol, debugCol;',
			'		float den, df, dtm, alpha, shadeFactor;',

			'                            //for(int i = 0; i < N; i++){',
			'#define POS()                   pos = t * rayDir + rayStart;',
			'#define DENSITY(MAP)            den = MAP(pos*noiseScale + noiseOffset)*denMultiplier + denOffset',
			'                                //if(den > 0.01){',
			'#define HANDLE_TRANSMITTANCE()      dtm = exp(-transmittance * den); tm *= dtm',
			'#define SHADE_FACTOR()              shadeFactor = 1. - dot(pos, sunPosition)',
			'#define COLOR()                     uCol = mix(diffuseColor, shadeColor, shadeFactor * shadeFactor + den*4.) / (pow(shadeFactor + den*1., .4) * 1.0)',
			'#define DEBUG_COLOR()               if(debugLOD){ uCol = uCol * debugCol; }',
			'#define ACCUMULATE_COLOR()          col += (1.0 - dtm) * uCol * tm',
			'                                //}',
			'#define STEP(MIN_STEP, SCALE)   df = (scd *.25 + t); stepSize = max(MIN_STEP, df*SCALE); t += stepSize',
			'#define RETURN()                alpha = 1.0 - tm; return vec4(col / max(alpha, 0.01), alpha * alpha)',
			'#define EXIT_CONDITION()        if(t >= maxLen || tm < 0.01){RETURN();}',
			'                            //}',

			'//full march loop',
			'#define MARCH(N, MAP, MIN_STEP, STEP_SCALE) for(int i = 0; i < N; i++){ POS(); DENSITY(MAP); if(den > 0.01){ HANDLE_TRANSMITTANCE(); SHADE_FACTOR(); COLOR(); DEBUG_COLOR(); ACCUMULATE_COLOR(); } STEP(MIN_STEP, STEP_SCALE); EXIT_CONDITION(); }',
			'		',

			'		const float d = 0.6;',
			'		debugCol = vec3(d, d, 1.0);//blue',
			'		MARCH(10, map3, 0.01, 0.00);',
			'		',
			'		debugCol = vec3(d, 1.0, d);//green',
			'		MARCH(80, map6, 0.008, 0.005);',

			'		debugCol = vec3(1.0, d, d);//red',
			'		MARCH(40, map5, 0.01, 0.00);',

			'		debugCol = vec3(1.0, 1.0, d);//yellow',
			'		MARCH(60, map4, 0.015, 0.00);',

			'		//debugCol = vec3(1.0, d, 1.0);//pink/purple',
			'		MARCH(100, map2, 0.2, 0.00);',

			'		RETURN();',
			'	}',

			'	void main(void){',
			'		vec4 bfsamp = texture2D(backfaceTexture, gl_FragCoord.xy * backfaceInvResolution);',

			'		//@!debug',
			'		//gl_FragColor = vec4(bfsamp.xyz, 1.0);',
			'		//return;',

			'		//reject null backface texture sample',
			'		//this is where the current pixel doesn\'t line up exactly with a backface pixel',
			'		if(bfsamp.a < 0.01){',
			'			gl_FragColor = vec4(0);',
			'			return;',
			'		}',

			'		vec3 rayStart = worldCoord;',
			'		vec3 rayEnd = bfsamp.xyz;',
			'		vec3 rayVec = rayEnd - rayStart;',
			'		float rayLen = length(rayVec);',
			'		vec3 rayDir = rayVec / rayLen;',

			'		vec4 col = raymarchTransmittance(rayStart, rayDir, rayLen * 1.0);',

			'		//sun glare',
			'		float dotSun = dot(sunPosition, rayDir);',

			'		if(dotSun < 0.0){',
			'			dotSun = -dotSun * 0.3;//reduce reflection intensity',
			'			col.xyz += 0.4*vec3(0.99,0.99,0.90) * dotSun;',
			'		}else{',
			'			col.xyz += 0.4*vec3(0.99,0.99,0.90) * dotSun * dotSun * dotSun / max(col.a, 0.01);',
			'		}',


			'		gl_FragColor = col;',
			'	}'
		].join('\n')
	}
};