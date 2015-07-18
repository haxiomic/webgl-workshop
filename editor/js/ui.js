var UI = (function(){
	var pub = {};

	var statusClasses = [
		'success',
		'failure'
	];


	//init
	pub.messagesEl = document.querySelector('#messages');
	pub.editorEl = document.querySelector('#editor');
	pub.overlay = document.querySelector('#overlay');
	pub.topBar = document.querySelector('#top-bar');
	pub.preview = document.querySelector('#preview');

	//menu buttons
	pub.topBar.cheatSheet = pub.topBar.querySelector('.cheat-sheet');
	pub.topBar.cheatSheet.addEventListener('click', function(e){
		pub.isOverlayVisible() ? pub.hideOverlay() : pub.showOverlay();
	});


	pub.topBar.fullscreen = pub.topBar.querySelector('.fullscreen');
	pub.topBar.fullscreen.addEventListener('click', function(e){
		pub.fullscreenCanvas();
	});

	//close button action
	var overlayCloseLinks = pub.overlay.querySelectorAll('.close');
	for(var i = 0; i < overlayCloseLinks.length; i++){
		overlayCloseLinks[i].addEventListener('click', function(e){
			pub.hideOverlay();
		});
	}

	//execute trim on all <pre class="trim"> elements
	var trimPres = document.querySelectorAll('pre.trim');
	for(var i = 0; i < trimPres.length; i++){
		trimPres[i].innerHTML = trimPres[i].innerHTML.trim();
	}

	//automatically add ace static to any pres and codes within page
	var pageCodes = document.querySelectorAll('.page code, .page pre');
	for(var i = 0; i < pageCodes.length; i++){
		pageCodes[i].classList.toggle('ace-static', true);
		pageCodes[i].setAttribute('ace-mode', 'ace/mode/glsl');
		pageCodes[i].setAttribute('ace-theme', 'ace/theme/chrome');
	}

	//static ace highlight
	require(['ace/ace', 'ace/ext/static_highlight'], function(ace){
		var highlight = ace.require('ace/ext/static_highlight');
		var staticCodes = document.querySelectorAll('.ace-static');
		for(var i = 0; i < staticCodes.length; i++){
			var codeEl = staticCodes[i];
			var mode = codeEl.getAttribute('ace-mode');
			var theme = codeEl.getAttribute('ace-theme');
			var showGutter = !!codeEl.getAttribute('ace-gutter');
			highlight(
				codeEl,
				{
					mode: mode ? mode : 'ace/mode/javascript',
					theme: theme,
					startLineNumber: 1,
					showGutter: showGutter,
					trim: true
				},
				function (highlighted){}
			);
		}
	});
	var staticCodes = document.querySelectorAll('.page ace-static');
	for(var i = 0; i < staticCodes.length; i++){
		staticCodes[i];
	}


	//initial dataset
	pub.messagesEl.dataset.shown = parseInt(window.getComputedStyle(pub.messagesEl).bottom) >= 0;

	//window resize
	window.addEventListener('resize', function(){
		pub.updateBoundary();
	});

	pub.hideMessages = function(){
		pub.messagesEl.dataset.shown = false;

		var messagesHeight = pub.messagesEl.offsetHeight;
		pub.messagesEl.style.bottom = -messagesHeight + 'px';
		pub.editorEl.style.bottom = '0px';

		var animDuration = parseFloat(window.getComputedStyle(pub.messagesEl).transitionDuration);
		setTimeout(function(){
			pub.editorEl.aceEditor.resize(true);
		}, animDuration * 1000);
	}

	pub.showMessages = function(){
		pub.messagesEl.dataset.shown = true;

		var messagesHeight = pub.messagesEl.offsetHeight;
		pub.messagesEl.style.bottom = '0px';
		pub.editorEl.style.bottom = messagesHeight+'px';
		pub.editorEl.style.display = '';

		var animDuration = parseFloat(window.getComputedStyle(pub.messagesEl).transitionDuration);
		setTimeout(function(){
			pub.editorEl.aceEditor.resize(true);
		}, animDuration * 1000);
	}

	pub.clearMessages = function(){
		pub.messagesEl.querySelector('.content').innerHTML = '';
		pub.updateBoundary();
	}

	pub.updateBoundary = function(){
		//resize boundary
		var contentEl = pub.messagesEl.querySelector('.content');
		var messagesStyle = window.getComputedStyle(pub.messagesEl);
		var pt = parseFloat(messagesStyle.paddingTop);
		var pb = parseFloat(messagesStyle.paddingBottom);
		pub.messagesEl.style.height = contentEl.offsetHeight + pt + pb + 'px';

		(pub.messagesEl.dataset.shown === 'true' ? pub.showMessages() : pub.hideMessages());
	}

	pub.setMessages = function(messages, status){
		//set class
		for(var i = 0; i < statusClasses.length; i++)
			pub.messagesEl.classList.toggle(statusClasses[i], false);

		if(statusClasses.indexOf(status) != -1)
			pub.messagesEl.classList.toggle(status, true);

		var contentEl = pub.messagesEl.querySelector('.content');
		contentEl.innerHTML = messages ? '<ul><li>' + messages.join('</li><li>') + '</li></ul>' : '';

		pub.updateBoundary();
	}

	pub.setEditorStatus = function(status){
		//set class
		for(var i = 0; i < statusClasses.length; i++)
			pub.editorEl.classList.toggle(statusClasses[i], false);

		if(statusClasses.indexOf(status) != -1)
			pub.editorEl.classList.toggle(status, true);
	}

	pub.showOverlay = function(){
		pub.overlay.style.display = 'block';
		pub.topBar.cheatSheet.classList.toggle('active', true);
	}

	pub.hideOverlay = function(){
		pub.overlay.style.display = 'none';
		pub.topBar.cheatSheet.classList.toggle('active', false);
	}

	pub.isOverlayVisible = function(){
		return window.getComputedStyle(UI.overlay).display !== 'none';
	}

	pub.fullscreenCanvas = function(){
		if(pub.preview.webkitRequestFullScreen){
			pub.preview.webkitRequestFullScreen();
			return;
		}

		if(pub.preview.mozRequestFullScreen){
			pub.preview.mozRequestFullScreen();
			return;
		}
	}

	return pub;
})();

// UI.showOverlay()