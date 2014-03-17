function NodeFolderImpl() {
	var that=this;
	
	this.initialize=function(params,callback) {
		if (callback) callback();
	};
	
	this.command=function(cmd,params,callback) {
		
		if (!callback) callback=function() {};
		
		var path=params.path||'';
		
		if (cmd=='getFileNames') {
			Wisdm.fileSystemCommand({command:'ls',working_path:path},function(tmp) {
				if (tmp.success=='true') {
					callback(tmp.files,{success:true});
				}
				else callback([],{success:false,error:tmp.error});
			});
		}
		else if (cmd=='getFolderNames') {
			Wisdm.fileSystemCommand({command:'ls',working_path:path},function(tmp) {
				if (tmp.success=='true') {
					callback(tmp.dirs,{success:true});
				}
				else callback([],{success:false,error:tmp.error});
			});
		}
		else if (cmd=='getFileText') {
			Wisdm.getFileData({path:path,mode:'text'},function(tmp) {
				if (tmp.success=='true') {
					callback(tmp.data,{success:true});
				}
				else callback([],{success:false,error:tmp.error});
			});
		}
		else if (cmd=='setFileText') {
			Wisdm.setFileData({path:path,data:params.text},function(tmp) {
				if (tmp.success=='true') {
					callback({success:true});
				}
				else callback([],{success:false,error:tmp.error});
			});
		}
		else if (cmd=='getFileData') {
			Wisdm.getFileData({path:path},function(tmp) {
				if (tmp.success=='true') {
					callback(tmp.data,{success:true});
				}
				else callback([],{success:false,error:tmp.error});
			});
		}
		else if (cmd=='setFileData') {
			Wisdm.setFileData({path:path,data:params.data},function(tmp) {
				if (tmp.success=='true') {
					callback({success:true});
				}
				else callback([],{success:false,error:tmp.error});
			});
		}
		else {
			callback({success:false,error:'Unrecognized command: '+cmd});
		}
		
	};
}
