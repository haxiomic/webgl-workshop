var UI = (function(){
	var pub = {};

	var statusClasses = [
		'success',
		'failure'
	];

	pub.messagesEl = document.querySelector('#messages');
	pub.editorEl = document.querySelector('#editor');

	//initial dataset
	pub.messagesEl.dataset.shown = parseInt(window.getComputedStyle(pub.messagesEl).bottom) >= 0;

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

	return pub;
})();