require('pages:/core/wisdm.js');
require('pages:/widgets/mapjswidget/mapjswidget.js');
require('pages:/widgets/wisdmcodeeditor/wisdmcodeeditor.js');

document.onWisdm=function() {
	var W1=new WisdmMapWidget();
	$('#content').append(W1.div());
	W1.initialize();
	
	function update_layout() {
		var W0=$('#content').width()-20;
		var H0=$('#content').height()-20;
		console.log(W0,H0);
		W1.setSize(W0,H0);
	}
	update_layout();
	$(window).resize(update_layout);
	
	setTimeout(function() {
		
		W1.setMap(test_map());
	},1000);
	
	function show_map_in_console() {
		var map=W1.getMap();
		console.log(map);
	}
	function to_repeat() {
		show_map_in_console();
		setTimeout(to_repeat,5000);
	}
	setTimeout(to_repeat,1000);
};

function WisdmMapWidget() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H; update_layout();};
	this.initialize=function() {return _initialize();};
	this.setMap=function(map) {return m_mapjs_widget.setMap(map);};
	this.getMap=function() {return m_mapjs_widget.getMap();};
	
	var m_editor_mode=false;
	var m_div=$('<div></div>');
	var m_mapjs_widget=new MapJSWidget();
	var m_editor=new WisdmCodeEditor();
	m_div.append(m_mapjs_widget.div());
	m_div.append(m_editor.div());
	
	m_mapjs_widget.setAttachmentEditor({edit:on_edit_attachment});
	
	function _initialize() {
		setTimeout(function() {
			m_mapjs_widget.initialize();
		},300);
		
	}
	function update_layout() {
		m_div.css({position:'absolute',width:m_width,height:m_height});
		console.log('setting size',m_width,m_height);
		m_mapjs_widget.setSize(m_width,m_height);
		m_editor.setSize(m_width,m_height);
		
		if (m_editor_mode) {
			m_editor.div().show();
			m_mapjs_widget.div().hide();
			m_mapjs_widget.setInputEnabled(false);
		}
		else {
			m_editor.div().hide();
			m_mapjs_widget.div().show();
			m_mapjs_widget.setInputEnabled(true);
		}
	}

	function on_edit_attachment(params,callback) {
		console.log('on_edit_attachment',params);
		m_editor.setText(params.content);
		m_editor_mode=true;
		update_layout();
	}
	
}





function test_map() {
	
	return {
		root:{
			title:'This is a test map',
			children:[
				{title:'child1',negative:true},
				{title:'child2',attachment:{contentType:"text/html",content:"content <b>bold content</b>"}},
				{title:'child3',children:[
					{title:'grandchild1'},
					{title:'grandchild2'},
					{title:'grandchild3'}
				]}
			]
		}
	};
	
	return {
		"formatVersion":2,
		"title":"Test Map",
		"id":'1',
		"attr":{"style":{"background":"#FF0000"},
			"icon":{
				url: 'http://localhost/PICTURES/armadillo.jpg',
				height: 200, 
				width: 256,
				position: 'top'
			},
			"attachment":{"contentType":"text/html","content":"content <b>bold content</b>"}
		},
		"ideas":{
			"11":{
				"title":"4",
				"id":4,
				"ideas":{
					"2":{
						"title":"7 is long",
						"id":7,
						"ideas":{
							"2":{
								"title":"91",
								"id":9
							},
							"5":{
								"title":"12",
								"id":12
							},
							"6":{
								"title":"We'll be famous...",
								"id":34
							}
						}
					}
				}
			},
			"12":{
				"title":"A cunning plan...",
				"id":15,
				"ideas":{
					"1":{
						"title":
						"10",
						"id":10,"attr":{position:[0,100]}
					}
				}
			}
		}
	};
}
