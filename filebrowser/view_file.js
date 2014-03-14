require('pages:/widgets/viewmda/viewmda.js');
require('pages:/widgets/imageview/imageview.js');
require('pages:/widgets/timeseriesplot/timeseriesplot.js');

function view_file(path,params,callback) {
	if (!params) params={};
	
	var suf=utils.get_file_suffix(path);
	if ((suf=='mda')||(suf=='nii')||(suf=='hdr')||(suf=='img')) {
		var VV=new ViewMda();
		VV.setArrayPath(path);
		VV.setTitle(utils.get_file_name(path));
		VV.showDialog();
		if (callback) callback('');
	}
	else if ((suf=='jpg')||(suf=='png')||(suf=='gif')||(suf=='bmp')) {
		var VV=new ImageView();
		VV.setImagePath(path);
		VV.setTitle(params.title||'');
		VV.showDialog();
		if (callback) callback('');
	}
	else if (suf=='par') {
		var VV=new TimeSeriesPlot();
		VV.setArrayPath(path);
		VV.setTitle(utils.get_file_name(path));
		VV.showDialog();
		if (callback) callback('');
	}
	else if (suf=='wp') {
		var url0='';
		if (params.edit) 
			url0='$approot$/../../wpageeditor/wpageeditor.html?node='+Wisdm.sessionNode+'&path='+path;
		else
			url0='$approot$/../../wpageview/wpageview.html?node='+Wisdm.sessionNode+'&path='+path;
		window.open(url0,'_blank');
	}
	else if (suf=='txt') {
		Wisdm.getFileData({path:path,mode:'text'},function(tmp) {
			if (tmp.success=='true') {
				TextOutputDialog({title:path,output:tmp.data});
			}
			else {
				console.log('Error getting file data: '+path);
			}
		});
	}
}

function show_file_history(path,callback) {
	Wisdm.getProcessHistory({path:path},function(tmp) {
		console.log(tmp);
		if (tmp.success=='true') {
			if (callback) callback('');
		}
	});
}

function TextOutputDialog(params) {
	var that=this;
	
	if (!params) params={};
	
	this.setOutput=function(output) {return _setOutput.apply(this,arguments);};
	this.setTitle=function(title) {m_title=title;};
	this.show=function() {return _show.apply(this,arguments);};
	this.hide=function() {return _hide.apply(this,arguments);};
		
	var m_div=$('<div><div id=output></span></div>');
	var m_title='';
	
	m_div.find('#output').css({position:'absolute',left:10,top:10,right:20,bottom:20,
														 overflow:'auto','background-color':'rgb(200,200,200)',color:'black',"font-size":'10px'});
	
	var _show=function() {
		m_div.dialog({width:600,
										height:400,
										resizable:false,
										modal:true,
										title:m_title,
										buttons: { "Ok": function() {that.hide();}}
									});
	};
	var _hide=function() {
		m_div.dialog('close');
	};
	var _setOutput=function(output) {
		output=output.split('\n').join('<br/>\n');
		m_div.find('#output').html(output);
	};
			
	if ('title' in params) that.setTitle(params.title);
	if ('output' in params) that.setOutput(params.output);
	that.show();
}
