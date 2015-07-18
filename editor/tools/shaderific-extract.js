var glslFunctions = [];

var codes = document.querySelectorAll('h1 + pre');
for(var i = 0; i < codes.length; i++){
	var c = codes[i];
	var h1 = c.previousElementSibling;
	var s = c.textContent;

	//extract function data
	var funReg = /^([\w]+)\s+(\w+)\s*\(((\s*[\w]+\s+[\w]+,?)+)\s*\)/igm;
	var result = funReg.exec(s);
	if(!result) continue;

	var returnType = result[1];
	var name = result[2];
	var parametersStr = result[3];

	//split parameter data
	var parameters = [];
	var paramStrArray = parametersStr.split(',');
	for(var j = 0; j < paramStrArray.length; j++){
		var p = paramStrArray[j].trim();
		var pa = p.split(' ');
		parameters.push({
			name: pa[1],
			returnType: pa[0]
		});
	}

	//extract description
	var descriptions = [];
	var el = c;
	while(true){
		var nx = el.nextElementSibling;
		el = nx;
		if(!nx) break;
		if(nx.tagName !== 'PRE' && nx.tagName !== 'P') break;
		if(nx.tagName === 'P'){
			descriptions.push(nx.textContent);
		}
	}

	glslFunctions.push({
		shaderificID: h1.id,
		name: name,
		returnType: returnType,
		parameters: parameters,
		descriptions: descriptions
	});
}

//print table
var tableStr = '<table class="mono-title">';

for(var i = 0; i < glslFunctions.length; i++){
	var f = glslFunctions[i];

	var moreInfoURL = 'http://www.shaderific.com/glsl-functions/#'+f.shaderificID;
	var onclickJS = '';//'window.open(\''+moreInfoURL+'\', \'_blank\').focus()';//'document.location.href = \''+moreInfoURL+'\';';
	tableStr += '<tr onclick="javascript:'+onclickJS+'">';

	var parameterNames = [];
	for(var j = 0; j < f.parameters.length; j++){
		var p = f.parameters[j];
		parameterNames.push(p.name);
	}

	tableStr += '<th>' + f.name + '(' + parameterNames.join(', ') + ')' + '</th>';

	function shorten(str){
		//remove 'The XXXX function'
		var prefixReg =  /^\s*The\s+[\w]+\s+function\s+/i;
		str = str.replace(prefixReg, '');

		//capitalize first letter
		str = str.charAt(0).toUpperCase() + str.substr(1);

		//cut to length
		var truncate = true;
		var max = 50;
		if(truncate){
			var needsShorten = str.length > max;
			if(!needsShorten) return str;

			//find nearest end of word
			var c;
			while(true){
				c = str.charAt(max);
				if(!c) break;
				if(c === " ") break;
				max++;
			}

			var ss = str.substr(0, max);
			str = ss + ' ... ' + '<a class="more-link" target="_blank" href="'+moreInfoURL+'">more</a>';
		}

		return str;
	}

	tableStr += '<td title="'+f.descriptions[0].replace('"', '&quot;')+'">' + shorten(f.descriptions[0]) + '</td>';

	tableStr += '</tr>';
}

tableStr += '</table>';

document.write(tableStr);