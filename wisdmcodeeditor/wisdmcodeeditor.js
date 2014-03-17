require("wisdmjs:/3rdparty/normalize/normalize.css");
require('modernizr.js');
require('codemirror.js');

function WisdmCodeEditor(params) {
	var that=this;
	
	this.div=function() {return m_div;};
	this.getText=function() {if (!m_CM) return ''; else return m_CM.text();};
	this.setText=function(txt) {after_init(function() {m_CM.text(txt);});};
	this.setReadOnly=function(val) {after_init(function() {m_CM.readOnly(val); update_background_color();});};
	this.setSize=function(W,H) {m_div.css({width:W,height:H});};
	//this.isModified=function() {return m_modified;}
	//this.setModified=function(val) {m_modified=val;}
	//this.onModified=function(handler) {m_modified_handlers.push(handler);}
	this.onKeyPress=function(handler) {m_key_press_handlers.push(handler);};
	//this.gotoLine=function(line_number) {return _gotoLine.apply(this,arguments);}
	this.setLanguage=function(language) {m_params.language=language; if (m_initialized) {m_div.language(language);}};
	this.insertText=function(text) {if (m_CM) m_CM.replaceSelection(text);};
	this.setFocus=function() {if (m_CM) m_CM.setFocus(); else m_div.focus();};
	this.selectedText=function() {if (m_CM) return m_CM.selectedText(); else return '';};
	
	var m_div=$('<div></div>');
	var m_modified=false;
	var m_modified_handlers=[];
	var m_key_press_handlers=[];
	var m_params=$.extend({language:'javascript',theme:'eclipse',readonly:false},params);
	var m_init_handlers=[];
	var m_initialized=false;
	var after_init=function(callback) {if (m_initialized) callback(); else m_init_handlers.push(callback);};
	m_div.attr("tabIndex",0); //enable focus
	
	m_div.css({position:'absolute',border:'solid 1px'});
	
	
	var m_CM=null;
	setTimeout(function() {
		m_CM = m_div.WisdmCodeMirror({
			readOnly : m_params.readonly,
			text     : '',
			language : m_params.language,
			theme    : m_params.theme,
			callback : function(){
				m_initialized=true;
				m_CM.clear(); //notice that since we do clear, when you hit CTRL+Z you cannot go back to the original text (that is, you cannot see var keep_testing. So this is different from $cm.text(''))
				//m_CM.theme('monokai');
				//m_CM.language('htmlmixed');
				for (var ii=0; ii<m_init_handlers.length; ii++) m_init_handlers[ii]();
				m_div.language(m_params.language);
			}
		});
		m_CM.onKeyPress(function(event) {
			if ((event.ctrlKey)&&(event.which==117)) { //ctrl+F6
				m_CM.replaceSelection(makeRandomId().toUpperCase());
			}
			for (var ii=0; ii<m_key_press_handlers.length; ii++) m_key_press_handlers[ii](event);
		});
	},100);
	
	var on_change=function() {
		m_modified=true;
		for (var ii=0; ii<m_modified_handlers.length; ii++) {
				(m_modified_handlers[ii])();
		}
	};
		
	var update_background_color=function() {
		if (!m_CM) {
			after_init(update_background_color);
			return;
		}
		var col='white';
		if (m_CM.readOnly()) col='rgb(220,220,220)';
		m_div.css('background-color',col);
	}
	update_background_color();
	
	
}
