require('pages:/3rdparty/mapjs/lib/jquery.mousewheel-3.1.3.js');
require('pages:/3rdparty/mapjs/lib/jquery.hotkeys.js');
require('pages:/3rdparty/mapjs//lib/jquery.hammer.min.js');
require('pages:/3rdparty/mapjs/lib/underscore-1.4.4.js');
require('pages:/3rdparty/mapjs/lib/kinetic-v4.5.4.js');
require('pages:/3rdparty/mapjs/lib/color-0.4.1.min.js');
require('pages:/3rdparty/mapjs/src/kinetic.clip.js');
require('pages:/3rdparty/mapjs/src/kinetic.idea.js');
require('pages:/3rdparty/mapjs/src/kinetic.connector.js');
require('pages:/3rdparty/mapjs/src/kinetic.link.js');
require('pages:/3rdparty/mapjs/src/observable.js');
require('pages:/3rdparty/mapjs/src/mapjs.js');
require('pages:/3rdparty/mapjs/src/url-helper.js');
require('pages:/3rdparty/mapjs/src/content.js');
require('pages:/3rdparty/mapjs/src/layout.js');
require('pages:/3rdparty/mapjs/src/clipboard.js');
require('pages:/3rdparty/mapjs/src/map-model.js');
require('pages:/3rdparty/mapjs/src/drag-and-drop.js');
require('pages:/3rdparty/mapjs/src/kinetic-mediator.js');
require('pages:/3rdparty/mapjs/src/map-toolbar-widget.js');
require('pages:/3rdparty/mapjs/src/png-exporter.js');
require('pages:/3rdparty/mapjs/src/map-widget.js');
require('pages:/3rdparty/mapjs/src/link-edit-widget.js');
require('pages:/3rdparty/mapjs/src/image-drop-widget.js');
require('pages:/3rdparty/mapjs/test/perftests.js');


/*
Note that for now, we cannot have more than one MapJSWidget on the same page
*/

function MapJSWidget() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H; update_layout();};
	this.initialize=function() {return _initialize();};
	this.setMap=function(map) {return _setMap(map);};
	this.getMap=function() {return _getMap();};
	this.setInputEnabled=function(val) {m_input_enabled=val; m_map_model.setInputEnabled(val);};
	this.onOpenAttachment=function(callback) {m_attachment_callback=callback;};
	this.getNodeData=function(node_id) {return _getNodeData(node_id);};
	this.setNodeAttachment=function(node_id,attachment) {_setNodeAttachment(node_id,attachment);};
	this.addNode=function(parent_node_id,node_data) {_addNode(parent_node_id,node_data);};
	this.getRootNodeId=function() {return (m_idea||{}).id||null;};
	this.setStyleFunction=function(func) {m_style_function=func;};
	this.testfunc=function(params) {return _testfunc(params);};
	this.getSelectedNodeId=function() {return _getSelectedNodeId();};
	this.onKeyPressed=function(callback) {m_div.bind('on-key-pressed',function(evt,obj) {callback(obj);});};
	this.refreshMap=function() {that.setMap(that.getMap());};
	
	
	var m_div_id='mapjswidget-'+makeRandomId(5); //seems to be important that the div has a unique id
	var m_div=$('<div id="'+m_div_id+'"></div>');
	var m_map_model=null;
	var m_idea={};
	var m_last_ids={last_neg:0,last_pos:0};
	var m_input_enabled=true;
	var m_attachment_callback=function(node_id) {console.log('attachment callback not defined',node_id);};
	var m_style_function=null;
	
	//initialize the map model
	var isTouch=false; //I am guessing this would be true on a touch screen?
	var imageInsertController=new MAPJS.ImageInsertController("http://localhost:4999?u="); //not sure about this
	m_map_model=new MAPJS.MapModel(MAPJS.KineticMediator.layoutCalculator, []);
	
	m_map_model.addEventListener('attachmentOpened', function (nodeId, attachment) {
		//for debugging purposes, it is better to do it this way, so we can see the errors in console
		setTimeout(function() {
			m_attachment_callback(nodeId);
		},10);
	});
	
	m_map_model.addEventListener('nodeTitleChanged',function(node) {
		update_node_styles();
	});
	
	$(document).keypress(function (evt) {
		var key=String.fromCharCode(evt.which);
		if (!m_input_enabled) return;
		//if (key=='c') do_copy();
		//else if (key=='v') do_paste();
		var idea=get_selected_idea();
		var node_id=idea.id||null;
		m_div.trigger('on-key-pressed',{node_id:node_id,key:key,event:evt});
	});
	
	function _initialize() {
		m_div.mapWidget(console,m_map_model,isTouch,imageInsertController);
		
		//jQuery('body').attachmentEditorWidget(m_map_model);
	}
	
	function get_next_id(negative) {
		if (!negative) {
			m_last_ids.last_pos++;
			return m_last_ids.last_pos;
		}
		else {
			m_last_ids.last_neg--;
			return m_last_ids.last_neg;
		}
	}
	function convert_node(node) {
		var ret={};
		ret.title=node.title||'';
		ret.attr={};
		if (node.attachment) ret.attr.attachment=$.extend({},node.attachment);
		if (node.collapsed) ret.attr.collapsed=true;
		ret.attr.style={};
		ret.id=get_next_id(node.negative||false);
		ret.ideas={};
		var children=node.children||[];
		
		for (var i=0; i<children.length; i++) {
			var tmp=convert_node(children[i]);
			ret.ideas[tmp.id]=tmp;
		}
		var max_items_to_display=10;
		if (children.length>max_items_to_display) {
			ret.hidden_ideas=ret.ideas;
			ret.ideas={};
			var tmp1=convert_node({title:'['+children.length+' items]'});
			ret.ideas[tmp1.id]=tmp1;
		}
		return ret;
	}
	function deconvert_node(idea,recursive) {
		var node={};
		node.title=idea.title||'';
		node.children=[];
		if ((idea.attr)&&(idea.attr.attachment)) node.attachment=$.extend({},idea.attr.attachment);
		if ((idea.attr)&&(idea.attr.collapsed)) node.collapsed=true;
		var ideas;
		if (idea.hidden_ideas) ideas=idea.hidden_ideas;
		else ideas=idea.ideas||{};
		if (recursive) {
			for (var idea_key in ideas) {
				var is_negative=(Number(idea_key)<0);
				var node2=deconvert_node(ideas[idea_key],recursive);
				if (is_negative) node2.negative=true;
				node.children.push(node2);
			}
		}
		return node;
	}
	
	function get_idea_from_id(node_id) {
		if (node_id==m_idea.id) {
			return m_idea;
		}
		else {
			return m_idea.findSubIdeaById(node_id);
		}
	}
	function _getNodeData(node_id) {
		var idea=get_idea_from_id(node_id);
		if (!idea) return null;
		var node=deconvert_node(idea,false);
		node.child_ids_by_title={};
		var ideas=idea.ideas||{};
		for (var key in ideas) {
			var id0=ideas[key].id;
			var title0=ideas[key].title;
			node.child_ids_by_title[title0]=id0;
		}
		node.parent_node_id=(m_idea.findParent(node_id)||{}).id||null;
		return node;
	}
	function _getSelectedNodeId() {
		var idea=get_selected_idea();
		var node_id=idea.id||null;
		return node_id;
	}
	function get_selected_idea() {
		var idea_id=m_map_model.getSelectedNodeId();
		var selected_idea=get_idea_from_id(idea_id);
		if (selected_idea) return selected_idea;
		else return null;
	}
	
	function do_copy() {
		var idea=get_selected_idea();
		if (idea) {
			var node=deconvert_node(idea,true);
			localStorage.mapjswidget_clipboard=JSON.stringify(node);
		}
	}
	function do_paste() {
		var tmp=localStorage.mapjswidget_clipboard||'';
		console.log(tmp);
		try {
			var node=JSON.parse(tmp);
		}
		catch(err) {
			return;
		}
		var idea=get_selected_idea();
		if (!idea.ideas) idea.ideas={};
		idea.ideas[get_next_id()]=convert_node(node);
		that.setMap(that.getMap());
	}
	function _testfunc(params) {
		if (params=='copy') {
		}
		else if (params=='paste') {
		}
		
	}
	
	function _setNodeAttachment(node_id,attachment) {
		m_map_model.setAttachment(
			'mapjswidget',
			node_id,{
				contentType:attachment.contentType||'text/plain',
				content:attachment.content||''
			}
		);
	}
	function _addNode(parent_node_id,node_data) {
		var idea=get_idea_from_id(parent_node_id);
		if (!idea) return;
		if (!idea.ideas) idea.ideas={};
		idea.ideas[get_next_id()]=convert_node(node_data);
		that.setMap(that.getMap());
	}
	
	function _setMap(map) {
		m_last_ids={last_neg:0,last_pos:0};
		var map_tmp=convert_node(map.root||{});
		map_tmp.formatVersion=2;
		
		//set the idea to the model
		m_idea=MAPJS.content(map_tmp);
		update_node_styles();
		
		console.log('is_visible: ');
		console.log(m_div.is(':visible'));
		console.log(m_div.width());
		console.log(m_div.height());
		m_map_model.setIdea(m_idea);
	}
	function _getMap() {
		var tmp=m_map_model.getIdea(); 
		tmp=tmp.clone(tmp.id);
		var root=deconvert_node(tmp,true);
		return {root:root};
	}
	
	function update_layout() {
		m_div.css({position:'absolute',width:m_width,height:m_height});
	}
	
	function update_node_styles() {
		update_node_styles_2(m_idea,true);
	}
	function update_node_styles_2(idea,is_root) {
		var title=idea.title||'';
		var suf=utils.get_file_suffix(title);
		if (!idea.attr) idea.attr={};
		if (!idea.attr.style) idea.attr.style={};
		var style=idea.attr.style;
		
		var data={
			title:idea.title||'',
			attachment:idea.attachment||{},
			is_root:is_root
		};
		
		if (m_style_function) {
			m_style_function(data,style);
		}
	
		for (var key in idea.ideas) {
			update_node_styles_2(idea.ideas[key],false);
		}
	}
}


