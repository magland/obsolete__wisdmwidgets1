require('jfm-doc.js');
require('wisdm-script.js');
require('matlab-script.js');

(function($) {
$.fn.WisdmCodeMirror = function(options) {
	//Defaults
	$.fn.WisdmCodeMirror.defaultOptions = {
		language      : 'javascript',
		theme         : 'eclipse',
		text          : '',
		readOnly      : true,
		includeSearch : true,
		includejsHint : true,
		callback      : function(){console.log ('codemirror3.1 loaded');}
	};
	//Private vars
	var CM,
			$that = this;
	var m_key_press_handlers=[];
	
	options = $.extend({}, $.fn.WisdmCodeMirror.defaultOptions, options);
	var m_language=options.language;
	
	/*Cancels the edit changes made and restores the last text set*/
	this.cancel = function(){	if (CM)	CM.setValue(options.text);};
	/*Deletes the current document and replaces it for an existing one*/
	this.clear = function(){	if (CM)	CM.swapDoc(CodeMirror.Doc('', options.language)); };
 /* Gets/sets text
	* @param text if specified, it will set this value as the text of the document
	* @returns (if no parameter is specified) it will return the current value of the codemirror object
	*/
	this.text = function(text){ return _text(text);};
 /* Getter and Setter: To Enables/Disables the read only mode on the codemirror object and adds/removes the 'readonly' class to the codemirror object
	* @param readonly if specified, it will set the editor to read only mode (true) or edit mode (false)
	* @returns (if no parameter is specified) it will return the current mode (true for read only, false for edit mode)
	*/
	this.readOnly = function(readonly){ return _readOnly(readonly);};
 /* Getter and Setter for the programming language coloring
	* @param language if specified, it will set the editor to the programming language specified. If the file is not yet loaded, Modernizr will dynamically load it for you
	* @returns (if no parameter is specified) it will return the current language.
	*/
	this.language = function(language, callback){ return _language(language, callback);};
 /* Getter and Setter for the theme style applied
	* @param theme if specified, it will set the editor to the theme style specified. If the file is not yet loaded, Modernizr will dynamically load it for you
	* @returns (if no parameter is specified) it will return the current theme name.
	*/
	this.theme = function(theme, callback){ return _theme(theme, callback);};
 /* @returns true if the content has changed since last time text was set and false otherwise */
	this.hasContentChanged = function(){ return options.text !== _text(); };
	this.onKeyPress=function(callback) {m_key_press_handlers.push(callback);};
	this.replaceSelection=function(txt) {if (CM) CM.replaceSelection(txt);};
	this.setFocus=function() {if (CM) CM.focus();};
	this.selectedText=function() {if (CM) return CM.getSelection(); else return '';};
		
	var _text = function(text){
		if (text === undefined) //getText
			return CM ? CM.getValue() : '';
		else if (CM){ //setText
			CM.setValue(text);
			options.text = text;
		}
	};

	var _readOnly = function(readonly){
		if (readonly === undefined) return options.readonly;
		
		options.readonly = readonly;
		if (CM)
			CM.setOption('readOnly', readonly);
		
		if (readonly)
			$that.addClass('readonly');
		else
			$that.removeClass('readonly');
		
		if (readonly) {
			$that.removeClass('wisdm-can-edit');
		}
		else {
			$that.addClass('wisdm-can-edit');
		}
	};
	
	var _language = function(language, callback){
		if (language === undefined) return options.language;
		m_language=language;
		
		var the_mode=language;
		if (language=='c++') the_mode='text/x-c++src';
		
		if (language=='jfm-doc') {
			if (CM) {
				define_jfm_doc();
				CM.setOption('lineWrapping',true);
				CM.setOption('theme','jfm-doc');	
				CM.setOption('mode','jfm-doc');
				if (callback) callback();
			}
			else {
				setTimeout(function() {
					_language(language);
				},1000);
			}
			if (callback) callback();
			return;
		}
		else if (language=='wisdm-script') {
			if (CM) {
				define_wisdm_script();
				//CM.setOption('theme','wisdm-script');	
				CM.setOption('mode','wisdm-script');
				if (callback) callback();
			}
		}
		else if (language=='matlab-script') {
			if (CM) {
				define_matlab_script();
				CM.setOption('mode','matlab-script');
				if (callback) callback();
			}
		}
		else {
			if (CM) {
				CM.setOption('lineWrapping',false);
				CM.setOption('theme',options.theme);
			}
		}
				
		var counter = 0,
				totalFiles,
				onLoadComplete = function(){
					counter++;
					if (counter === totalFiles){
						options.language = language;
						if (CM) {
							CM.setOption('mode', the_mode);
						}
						
						_addWarnings();

						if ($.isFunction(callback))
							callback();
					}
				},
				loadLanguage = function(language, callback){
					if (!Modernizr.languages) Modernizr.languages = {};
					Modernizr.load({
						//jfm
						load     : '$wisdmpages$/resources/codemirror/mode/' + language + '/' + language + '.js',
						//test     : Modernizr.languages[language],
						//nope     : '$wisdmpages$/resources/codemirror/mode/' + language + '/' + language + '.js',
						complete : function(){
							Modernizr.languages[language] = true;
							if ($.isFunction(callback))
								callback();
						}
					});
				};
		
		if (language === 'html' || language==='htmlmixed'){
			totalFiles = 4;
			loadLanguage('javascript',onLoadComplete);		
			loadLanguage('css',onLoadComplete);			
			loadLanguage('xml',onLoadComplete);
			loadLanguage('htmlmixed',onLoadComplete);
		}
		else if (language === 'c++') {
			totalFiles = 1;
			loadLanguage('clike',onLoadComplete);
		}
		else{
			totalFiles = 1;
			loadLanguage(language,onLoadComplete);
		}
	};
	var _theme = function(theme, callback){
		if (theme === undefined) return options.theme;
		
		if (!Modernizr.themes) Modernizr.themes = {};
		
		Modernizr.load({
			//jfm
			//test     : Modernizr.themes[theme],
			load     : '$wisdmpages$/resources/codemirror/theme/' + theme + '.css',
			//nope     : '$wisdmpages$/resources/codemirror/theme/' + theme + '.css',
			complete : function(){
				Modernizr.themes[theme] = true;
				
				options.theme = theme;
				
				if (CM)
					CM.setOption('theme', theme);
				if ($.isFunction(callback))
					callback();
			}
		});	
	};
	var is_reportable_error=function(err) {
		/*if (!err) return false;
		if (err.reason.indexOf('Expected to see a statement and instead saw a block')===0) {
			console.log (err);
			return false;
		}
		if (err.reason.indexOf('Expected an assignment or function call and instead saw an expression')===0) {
			console.log (err);
			return false;
		}
		if (err.reason.indexOf("Expected ')' and instead saw")===0) {
			console.log (err);
			return false;
		}
		if (err.reason.indexOf('Missing semicolon')===0) {
			//if (err.evidence.trim()=='{') return false;
			return false;
		}
		if (err.reason.indexOf(' is already defined')>=0) {
			return false;
		}
		return true;*/
		return true;
	};
	var lines_with_errors=[];
	var m_line_widgets=[];
	var _addWarnings = function(){
		Modernizr.load({
			load     : ['$wisdmpages$/resources/jshint/jshint.js', '$wisdmpages$/resources/jshint/jshint.css'],
			complete : function(){
				var updateHints = function() {
					if (!CM) return;
					
					if (m_language=='jfm-doc') {
						var refresh_jfm_doc_widgets=function() {
							$('body').append('<div class=invisible_stuff style="display:none"></div>');
							var old_line_widgets=m_line_widgets;
							m_line_widgets=[];
							if (get_jfm_doc_widgets) {
								var lines=CM.getValue().split('\n');
								var jfm_doc_widgets=get_jfm_doc_widgets(lines);
								for (var j=0; j<jfm_doc_widgets.length; j++) {
									var W0=jfm_doc_widgets[j];
									var found=null;
									for (var k=0; k<old_line_widgets.length; k++) {
										if (old_line_widgets[k].node===W0.div[0]) {
											if (old_line_widgets[k].node.line==W0.line) {
												found=old_line_widgets[k];
												old_line_widgets.splice(k,1);
											}
										}
									}
									if (found===null) {
										if (W0.div.parent().length===0) $('.invisible_stuff').append(W0.div);
										W0.div[0].line=W0.line;
										m_line_widgets.push(CM.addLineWidget(W0.line, W0.div[0], {coverGutter: false, noHScroll:false,showIfHidden:true}));
									}
									else {
										m_line_widgets.push(found);
									}
								}
								$('body').find('.invisible_stuff').remove();
							}
							
							for (var i=0; i<old_line_widgets.length; i++) {
								CM.removeLineWidget(old_line_widgets[i]);
							}
						};
						refresh_jfm_doc_widgets();
						CM.operation(refresh_jfm_doc_widgets);
						
					}
					
					if (m_language!='javascript') {
						CM.clearGutter('note-gutter');
						return;
					}
					
					CM.operation(function(){
						for (var j = 0; j < m_line_widgets.length; ++j)
							CM.removeLineWidget(m_line_widgets[j]);
						m_line_widgets.length = 0;
						
						//jfm/////////////////
						CM.clearGutter('note-gutter');
						lines_with_errors=[];
						//////////////////////
				
						if (options.language !== 'javascript') return; //we only allow them for js
						
						JSHINT(CM.getValue(),{funcscope:false});
						for (var i = 0; i < JSHINT.errors.length; ++i) {
							if (is_reportable_error(JSHINT.errors[i])) {
								//////////////////////////////
								//jfm
								/*var err = JSHINT.errors[i];
								if (!err) continue;
								var msg = document.createElement("div");
								var icon = msg.appendChild(document.createElement("span"));
								icon.innerHTML = "!";
								icon.className = "lint-error-icon";
								msg.appendChild(document.createTextNode(err.reason));
								msg.className = "lint-error";
								widgets.push(CM.addLineWidget(err.line - 1, msg, {coverGutter: false, noHScroll: true}));*/
								var err = JSHINT.errors[i];
								if (!err) continue;
								if (lines_with_errors.indexOf(err.line-1)<0) {
									var icon = document.createElement("span");
									icon.innerHTML = "!";
									icon.className = "lint-error-icon";
									$(icon).attr('title',err.reason);
									CM.setGutterMarker(err.line-1, "note-gutter", icon/*document.createTextNode("hi")*/);
									lines_with_errors.push(err.line-1);
								}
								/////////////////////////////////////
							}
						}
					});
					var info = CM.getScrollInfo();
					var after = CM.charCoords({line: CM.getCursor().line + 1, ch: 0}, "local").top;
					if (info.top + info.clientHeight < after)
						CM.scrollTo(null, after - info.clientHeight + 3);
				};
				var waiting;
				CM.on("change", function() {
					clearTimeout(waiting);
					waiting = setTimeout(updateHints, 500);
				});
				setTimeout(updateHints, 100);
			}
		});
	};
	var initialize = function(){
	//We load CodeMirror
		Modernizr.load({
			load     : ['$wisdmpages$/resources/codemirror/lib/codemirror.js',
									'$wisdmpages$/resources/codemirror/lib/codemirror.css'],
			complete : function(){
				//We add search options if search is enabled
				if (options.includeSearch){
					Modernizr.load({
						load: [
								'$wisdmpages$/resources/codemirror/addon/search/search.js',
								'$wisdmpages$/resources/codemirror/addon/search/searchcursor.js',
								'$wisdmpages$/resources/codemirror/addon/dialog/dialog.js',
								'$wisdmpages$/resources/codemirror/addon/dialog/dialog.css'
					]});
				}
				_language(options.language, function(){
					//jfm
					if (options.includejsHint){
						Modernizr.load({ 
							load     : ['$wisdmpages$/resources/jshint/jshint.js', '$wisdmpages$/resources/jshint/jshint.css'],
							complete : function(){
								//if (!Modernizr.jshint && CM) _addWarnings(); //jfm
								//_addWarnings();
							}
						});
					}
					
					//We create the code mirror object
					CM = CodeMirror($that[0], {
						mode           : options.language,
						lineNumbers    : true,
						tabSize        : 2,
						indentWithTabs : true,
						smartIdent     : false,
						extraKeys      : {
							"Tab"        : "indentMore", 
							"Shift-Tab"  : "indentLess", 
							"F3"         : "findNext",
							"Shift-F3"   : "findPrev",
							"Ctrl-Z"       : function(){
								if (!CM.getOption('readOnly'))
									CM.getDoc().undo();
							},
							"Shift-Ctrl-Z" : function(){
								if (!CM.getOption('readOnly'))
									CM.getDoc().redo();							
							}
						},
						onKeyEvent : on_key_event,
						gutters: ["note-gutter", "CodeMirror-linenumbers"] //jfm
					});
					//We add the warnings on code when errors are found (jshint) if it hasn't been added yet
					//if (!Modernizr.jshint && options.includejsHint){ _addWarnings();	}
					_addWarnings(); //jfm
					
					CM.setSize('100%', '100%');
					
					//and set the rest of default options
					_text(options.text);
					_readOnly(options.readOnly);
					_theme(options.theme, function(){
						if ($.isFunction(options.callback))
							options.callback(); //we callback when complete
					});
				});
				
			}
		});
	};
	var on_key_event=function(editor,event) {
		if (event.type=='keydown') {
			for (var ii=0; ii<m_key_press_handlers.length; ii++) {
				(m_key_press_handlers[ii])(event);
			}
		}
	};

	initialize();
	return this;
};
})(jQuery);