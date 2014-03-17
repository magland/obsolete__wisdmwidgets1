function TemporaryFolderImpl() {
	var that=this;
	
	var m_files={};
	var m_folders={};
	
	this.initialize=function(params,callback) {
		if (callback) callback();
	};
	
	this.command=function(cmd,params,callback) {
		
		if (!callback) callback=function() {};
		
		var path=params.path||'';
		
		var path1='',path2='';
		var ind=path.indexOf('/');
		if (ind<0) {
			path1=path; path2='';
		}
		else {
			path1=path.slice(0,ind);
			path2=path.slice(ind+1);
		}
		
		if (cmd=='getFileNames') {
			if (path1==='') {
				var ret=[];
				for (var key in m_files) ret.push(key);
				ret.sort();
				callback(ret,{success:true});
			}
			else {
				if (path1 in m_folders) {
					m_folders[path1].command('getFileNames',{path:path2},callback);
				}
				else {
					callback([],{success:false});
				}
			}
		}
		else if (cmd=='getFolderNames') {
			if (path1==='') {
				var ret=[];
				for (var key in m_folders) ret.push(key);
				ret.sort();
				callback(ret,{success:true});
			}
			else {
				if (path1 in m_folders) {
					m_folders[path1].command('getFolderNames',{path:path2},callback);
				}
				else callback([],{success:false});
			}
		}
		else if (cmd=='getFileText') {
			if (path2=='') {
				if (path1 in m_files) {
					callback(m_files[path1],{success:true});
				}
				else callback([],{success:false});
			}
			else {
				if (path1 in m_folders) {
					m_folders[path1].command('getFileText',{path:path2},callback);
				}
				else callback('',{success:false});
			}
		}
		else if (cmd=='setFileText') {
			if (path2=='') {
				if (path1!=='') {
					m_files[path1]=params.text||'';
					callback({success:true});
				}
				else callback([],{success:false});
			}
			else {
				if (path1!=='') {
					if (!(path1 in m_folders)) {
						m_folders[path1]=new TemporaryFolderImpl();
					}
					m_folders[path1].command('setFileText',{path:path2,text:params.text},callback);
				}
				else callback([],{success:false});
			}
		}
		else if (cmd=='getFileData') {
			if (path2=='') {
				if (path1 in m_files) {
					callback(m_files[path1],{success:true});
				}
				else callback([],{success:false});
			}
			else {
				if (path1 in m_folders) {
					m_folders[path1].command('getFileData',{path:path2},callback);
				}
				else callback([],{success:false});
			}
		}
		else if (cmd=='setFileData') {
			if (path2=='') {
				if (path1!=='') {
					m_files[path1]=params.data||'';
					callback({success:true});
				}
				else callback([],{success:false});
			}
			else {
				if (path1!=='') {
					if (!(path1 in m_folders)) {
						m_folders[path1]=new TemporaryFolderImpl();
					}
					m_folders[path1].command('setFileData',{path:path2,data:params.data},callback);
				}
				else callback([],{success:false});
			}
		}
		else {
			callback({success:false,error:'Unrecognized command: '+cmd});
		}
		
	};
}
