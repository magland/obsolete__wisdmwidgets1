require('pages:/core/wisdm.js');
require('pages:/widgets/wisdmfolderbrowser/wisdmfolderbrowser.js');

document.onWisdm=function() {
	initializeWisdmBanner({content:$('#content')});
	initializeWisdmSession({node:Wisdm.queryParameter('node','central'),supersession:true,login:true,manual:true,selectuser:false},function(tmp) {
		if (tmp.success) {
			do_initialize();
		}
		else {
			jAlert('Problem opening session: '+tmp.error);
		}
	});
};

function do_initialize() {
	var W=new WisdmFolderBrowser('local','/home/magland/dev/webgit');
	
	$('#content').append(W.div());
	
	W.setSize(400,600);
	W.refresh();
}