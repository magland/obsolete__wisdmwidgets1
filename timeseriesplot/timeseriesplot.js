require("pages:/widgets/plotwidget/plotwidget.js");
require("pages:/widgets/viewmda/mda.js");

function TimeSeriesPlot() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H; that.refresh();};
	this.setTitle=function(title) {m_title=title;};
	this.setArrayData=function(array_data) {m_array_data=array_data;};
	this.setArrayPath=function(path) {m_array_path=path; m_array=null;};
	this.refresh=function(callback) {return _refresh.apply(this,arguments);};
	this.showDialog=function(params) {_showDialog(params);};
	this.setSeriesPrefs=function(i,prefs) {m_series_prefs[i]=prefs;};
	this.onPlotClicked=function(callback) {m_view.onPlotClicked(callback);};
	var m_view=new PlotWidget();	
	
	var m_array_path='';
	var m_array=null;
	var m_array_data=null;
	var m_div=$('<div style="position:absolute" class="timeseriesplot"></div>');
	var m_width=0,m_height=0;
	var m_N1=0,m_N2=0;
	var m_info_div=$('<div class="timeseriesplot-info"></div>');
	var m_title_div=$('<div class="timeseriesplot-title"></div>');
	var m_status='Initializing...';
	var m_title='';
	var m_dialog_mode=false;
	var m_dialog=null;
	var m_series_prefs={};
	
	m_div.append(m_info_div);
	m_div.append(m_title_div);
	m_div.append(m_view.div());
	
	
	
	var do_initialize=function() {
	};		
	
	var _showDialog=function(params) {
		if (!params) params={};
		m_dialog=$('<div></div>');
		m_dialog.css({overflow:'hidden'});
		m_dialog.append(m_div);
		$('body').append(m_dialog);
		m_dialog.dialog({
			width:params.width||300,
			height:params.height||300,
			modal:params.modal||false,
			resize:function() {update_layout();}
		});
		m_dialog_mode=true;
		that.refresh();
	};
	
	
	var load_array=function(callback) {
		if (m_array_data) {
			if (callback) callback();
			return;
		}
		if ((m_array)||(m_array_path==='')) {
			if (callback) callback();
		}
		else {
			var suf=utils.get_file_suffix(m_array_path);
			if ((suf=='nii')||(suf=='hdr')||(suf=='img'))
				m_array=new Nii();
			else if (suf=='mda') 
				m_array=new Mda();
			else
				m_array=new TextArray();
			m_array.setPath(m_array_path);
			m_array.initialize(function(success,err) {
				if (success) {
					m_N1=m_array.N1();
					m_N2=m_array.N2();
				}
				else {
					console.log ('Error initializing array: '+err);
					m_array=null;
				}
				if (callback) callback();
			});
		}
	};
	
	function get_array_data(callback) {
		if (m_array_data) callback(m_array_data);
		else m_array.getDataXY([0,0],callback);
	}
	
	var m_refresh_scheduled=false;
	var global_refresh_code='';
	var _refresh=function(callback) {
		if (m_refresh_scheduled) return;
		
		var local_refresh_code=makeRandomId(5);
		global_refresh_code=local_refresh_code;
		m_status='Refreshing...';
		update_info();
		
		m_refresh_scheduled=true;
		m_status='Refreshing...';
		update_info();
		setTimeout(function() {
			if (global_refresh_code!=local_refresh_code) return;
			do_refresh(callback);
		},200);
		
		function do_refresh(callback) {
			m_refresh_scheduled=false;
			if (global_refresh_code!=local_refresh_code) return;
			update_layout();
		
			m_status='Waiting...';
			update_info();
			wait_for_visible(m_div,function() {
				if (global_refresh_code!=local_refresh_code) return;
				m_status='Loading...';
				update_info();
				load_array(function() {
					if (global_refresh_code!=local_refresh_code) return;
					update_layout();
					update_info();
					
					if ((m_array)||(m_array_data)) {
						get_array_data(function(data0,err) {
							if (global_refresh_code!=local_refresh_code) return;
							if (data0) {
								m_view.clearSeries();
								var xdata0=[];
								for (var t=0; t<data0.N1(); t++) xdata0.push(t+1);
								for (var i=0; i<data0.N2(); i++) {
									var ydata0=[];
									for (var t=0; t<data0.N1(); t++) ydata0.push(data0.value(t,i));
									var S0=m_series_prefs[i]||{};
									S0.xdata=xdata0;
									S0.ydata=ydata0;
									m_view.addSeries(S0);
								}
								m_view.refresh();
								m_status='ok';
								update_info();
								if (callback) callback();
							}
							else {
								m_status='Error in getDataXY: '+err;
								update_info();
								console.log ('Error in getDataXY: '+err);
							}
						});
					}
				});
			});
		}
	};
	var update_layout=function() {
		var margin0=5;
		var info_height=12;
		var title_height=15;
		
		if (m_dialog_mode) {
			title_height=0;
			m_title_div.hide();
			m_dialog.dialog('option','title',m_title);
		}
		else {
			m_title_div.show();
		}
		
		if (m_dialog_mode) {
			m_width=m_dialog.outerWidth();
			m_height=m_dialog.outerHeight();
			m_div.css({position:'absolute',left:0,right:0,top:0,bottom:0});
		}
		else {
			m_div.css({width:m_width,height:m_height});
		}
		
		m_view.div().css({position:'absolute',left:margin0,top:title_height+margin0});
		m_view.setSize(m_width-margin0*2-6,m_height-info_height-title_height-margin0*2-6);
		m_info_div.css({position:'absolute',width:m_width-margin0*2,height:info_height,bottom:0,left:margin0});
		update_info();
		m_title_div.css({position:'absolute',width:m_width-margin0*2,height:title_height,top:0,left:margin0});
		m_title_div.html(m_title);
		
		m_view.refresh(); //not sure if necessary
	};
	var update_info=function() {
		var txt='';
		if (m_status!='ok') txt+=m_status+' ';
		
		if (m_status=='ok') {
			//txt+=' <a href="#" id="show_history">history</a>';
			//txt+=' <a href="#" id="download_file">download</a>';
		}
		
		m_info_div.html('<nobr>'+txt+'</nobr>');
		
		//m_info_div.find('#show_history').click(on_show_history);
		//m_info_div.find('#download_file').click(on_download_file);
	};
	var m_update_info_scheduled=false;
	function schedule_update_info() {
		if (m_update_info_scheduled) return;
		m_update_info_scheduled=true;
		setTimeout(function() {
			m_update_info_scheduled=false;
			update_info();
		},200);
	}
	
	
	/*
	function on_show_history() {
		var path0=m_array_path;
		var url0='$approot$/../../processhistoryview/processhistoryview.html?node='+Wisdm.sessionNode+'&path='+path0;
		window.open(url0,'_blank');
	}
	function on_download_file() {
		var path0=m_array_path;
		Wisdm.downloadFile({
			path:path0
		});
	}
	*/
			
	var disable_selection=function(X) {
		X.attr('unselectable', 'on')
		.css({
				'user-select'         : 'none',
				'-webkit-user-select' : 'none',
				'-moz-user-select'    : 'none',   
				'-ms-user-select'     : 'none',
				'-o-user-select'      : 'none'
		})
		.on('selectstart', false);
	};
	disable_selection(m_div);
	do_initialize();
}

function TextArray() {
	var that=this;
	
	this.setPath=function(path) {m_path=path;};
	this.initialize=function(callback) {return _initialize(callback);};
	this.N1=function() {return m_N1;};
	this.N2=function() {return m_N2;};
	this.getDataXY=function(params,callback) {return _getDataXY(params,callback);};
	
	var m_path='';
	var m_N1=0;
	var m_N2=0;
	var m_array=new Array2D(1,1);
	
	function _initialize(callback) {
		Wisdm.getFileData({path:m_path,mode:'text'},function(tmp1) {
			if (tmp1.success=='true') {
				m_text=tmp1.data;
				var lines=m_text.split('\n');
				var lines2=[];
				for (var i=0; i<lines.length; i++) {
					var tmp=lines[i].trim();
					if (tmp) lines2.push(tmp);
				}
				m_N1=lines2.length;
				var line0=lines2[0]||'';
				var vals=line0.split(/\s+/);
				m_N2=vals.length;
				m_array=new Array2D(m_N1,m_N2);
				for (var j=0; j<m_N1; j++) {
					var line1=lines2[j]||'';
					var vals1=line1.split(/\s+/);
					for (var k=0; k<m_N2; k++) {
						m_array.setValue(Number(vals1[k]||0),j,k);
					}
				}
				callback(true,'');
			}
			else callback(false,tmp1.error);
		});
	}
	
	function _getDataXY(params,callback) {
		callback(m_array);
	}
}
