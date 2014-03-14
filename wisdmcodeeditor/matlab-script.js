var matlab_script_defined=false;
function define_matlab_script() {
	
	//if (matlab_script_defined) return; //not sure about this
	matlab_script_defined=true;
	
	window.matlab_script_start_state=function() {
		return {};
	};
	var matlab_keywords=['for','end','if','while','function','return','elseif','case','otherwise','switch','continue','else','try','catch','global','persistent','break'];
	window.matlab_script_token=function(stream,state) {
		
		if (stream.sol()) {
				//AT BEGINNING OF LINE
		}
		if (stream.match('%')) {
			stream.skipToEnd();
			return 'Matlab-comment';
		}
		for (var i=0; i<matlab_keywords.length; i++) {
			if (stream.match(matlab_keywords[i])) {
				return 'Matlab-keyword';
			}
		}
		stream.next();
		return 'Matlab';
	};

	CodeMirror.defineMode('matlab-script',function(config,mode_config) {
		return {
			startState:window.matlab_script_start_state,
			token:window.matlab_script_token
		};
	});
}
