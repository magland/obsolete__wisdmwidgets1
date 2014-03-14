require('filebrowser.js');

function choose_file(params,callback) {
	
	var width=600;
	var height=400;
	
	var X0=new FileBrowser();
	X0.setPath(params.working_path||'data:');
	X0.setSize(width-40,height-100);
	X0.refresh();
	X0.setFilesViewable(false);
	X0.onOpenFile(function(path) {
		callback({path:path});
		dialog0.dialog('close');
	});
	
	var dialog0=$('<div id="dialog"></div>');
	dialog0.append(X0.div());
	dialog0.dialog({
		width:width,
		height:height,
		resizable:false,
		modal:true,
		title:'Choose File'
	});
}
