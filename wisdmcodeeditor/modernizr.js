Modernizr={};

Modernizr.load=function(XX) {
	var already_loaded={};
	var do_load=function(str,callback) {
		if (str in already_loaded) {
			if (callback) callback();
			return;
		}
		already_loaded[str]=true;
		var ind=str.lastIndexOf('.');
		if (ind>=0) {
			var suf=str.substr(ind+1);
			if (suf=='js') {
				$.getScript(str)
				.done(function(script, textStatus) {
					if (callback) callback();
				})
				.fail(function(jqxhr, settings, exception) {
					if (callback) callback();
				});
			}
			else if (suf=='css') {
				$("<link/>", {
					 rel: "stylesheet",
					 type: "text/css",
					 href: str
				}).appendTo("head");
				if (callback) callback();
			}
		}
		else if (callback) callback();
	}
	if (typeof(XX.load)=='string') {
		do_load(XX.load,function() {
			if (XX.complete) XX.complete();
		});
	}
	else {
		var num_loaded=0;
		for (var ii=0; ii<XX.load.length; ii++) {
			do_load(XX.load[ii],function() {
				num_loaded++;
				if (num_loaded==XX.load.length)
					if (XX.complete) XX.complete();
			});
		}
	}
}
