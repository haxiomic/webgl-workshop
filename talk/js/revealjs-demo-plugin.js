/*
	Canvas Demos Plugin for reveal.js

	- requires demo.js

	@author George Corney (haxiomic)
*/

(function(){
	function getSlideBackgroundDemoCanvases(slide){
		var bgCanvases = [];
		//get background demos
		if(slide.dataset.backgroundDemo){
			var slideIndices = Reveal.getIndices(slide); 
			var bgContainer = Reveal.getSlideBackground(slideIndices.h, slideIndices.v);
			var canvas = bgContainer.querySelector('canvas');

			//create background canvas
			if(!canvas){
				canvas = document.createElement('canvas');

				//actual canvas size
				canvas.setAttribute('width', window.innerWidth + 'px');
				canvas.setAttribute('height', window.innerHeight + 'px');

				//canvas scaling
				canvas.style.width  = '100%';
				canvas.style.height = '100%';
				canvas.style.maxHeight = '100%';
				canvas.style.maxWidth = '100%';

				canvas.dataset.demo = slide.dataset.backgroundDemo;
				bgContainer.appendChild(canvas);
			}

			bgCanvases.push(canvas);
		}

		return bgCanvases;
	}

	function getSlideDemoCanvases(slide){
		var demoCanvases = [];
		if(!slide) return demoCanvases;
		//get a mutable array of canvases
		var nl = slide.querySelectorAll('canvas[data-demo]');
		for(var i = nl.length; i--; demoCanvases.unshift(nl[i]));

		demoCanvases = demoCanvases.concat(getSlideBackgroundDemoCanvases(slide));

		return demoCanvases;
	}

	function startDemos(slide){
		var demoCanvases = getSlideDemoCanvases(slide);
		
		for (var i = demoCanvases.length - 1; i >= 0; i--) {
			var canvas = demoCanvases[i];
			var demo = canvas.demo;

			if(!demo){ 
				//create demo
				var demoConstructor = DEMO[canvas.dataset.demo];
				if(!demoConstructor){
					console.error('Could not find demo "'+canvas.dataset.demo+'"');
					return;
				}
				
				canvas.demo = demo = new demoConstructor(canvas);
			}

			demo.start();


			//dispatch event
			var e = new CustomEvent('demo-started', {
				detail: demo
			});
			slide.dispatchEvent(e);
		};
	}

	function stopDemos(slide){
		var demoCanvases = getSlideDemoCanvases(slide);

		for (var i = demoCanvases.length - 1; i >= 0; i--){
			var canvas = demoCanvases[i];
			var demo = canvas.demo;
			if(demo){
				demo.stop();

				//dispatch event
				var e = new CustomEvent('demo-stopped', {
					detail: demo
				});
				slide.dispatchEvent(e);
			}
		};
	}

	//register event listeners
	Reveal.addEventListener('slidechanged', function(e){
		stopDemos(e.previousSlide);
		startDemos(e.currentSlide);
	});

	Reveal.addEventListener('ready', function(e){
		startDemos(e.currentSlide);
	});

	window.addEventListener('resize', function(e){
		//resize all background demos
		var slides = document.querySelectorAll('.reveal .slides section');
		for(var i = 0; i < slides.length; i++){
			var demoCanvases = getSlideBackgroundDemoCanvases(slides[i]);
			for(var j = 0; j < demoCanvases.length; j++){
				if(!demoCanvases[j].demo) continue;
				demoCanvases[j].demo.setSize(window.innerWidth, window.innerHeight);
			}
		}
	}, false);


})();