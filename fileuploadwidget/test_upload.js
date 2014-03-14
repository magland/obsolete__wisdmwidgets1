require("pages:/core/wisdm.js");
require('fileuploadwidget.js');

var WM=null;

document.onWisdm=function() {
	
	var node=Wisdm.queryParameter('node','central');
	var path=Wisdm.queryParameter('path','');
	
	initializeWisdmBanner({content:$('#content')});
	
	initializeWisdmSession({node:node,login:true,user:'',manual:true,selectuser:false,supersession:true},function(tmp) {
		if (tmp.success) {
			console.log ('Session opened.',Wisdm.session_id,Wisdm.currentUser);
			//initialization
			
			do_initialize(path);
		}
		else {
			jAlert(tmp.error);
		}
	});
};

function do_initialize(path) {
	var W=new FileUploadWidget();
	W.setUploadDirectory('data:/test/test_upload');
	W.setFileSizeLimit(5*1000*1000);
	W.setMultipleFilesMode(true);
	W.showDialog();
	W.onUpload(function(paths) {
		console.log(paths);
	});
}
