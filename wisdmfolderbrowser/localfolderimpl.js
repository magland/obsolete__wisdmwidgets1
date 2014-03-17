function LocalFolderImpl() {
	var that=this;

	var m_local_root='';
	var m_git_params={};
	
	this.initialize=function(params,callback) {
		m_local_root=params.path||params.local_root||'';
		if (callback) callback();
	};
	
	function localfilecgi_command(cmd,params,callback) {
		params.command=cmd;
		$.post('http://'+location.hostname+'/cgi-bin/localfilecgi',JSON.stringify(params),function(tmp) {
			if ((tmp.success||'')!=='true') {
				console.error('Error in localfilecgi call:',params.command,params,tmp);
			}
			if (callback) callback(tmp);
			
		});
	}
	
	this.command=function(cmd,params,callback) {
		
		if (!callback) callback=function() {};
		
		var path=params.path||'';
		
		if (cmd=='getFileTree') {
			localfilecgi_command('getFileTree',{path:m_local_root+'/'+path},function(tmp) {
				if (tmp.success=='true') {
					callback(tmp.tree,{success:true});
				}
				else callback([],{success:false,error:tmp.error});
			});
		}
		else if (cmd=='getFileNames') {
			localfilecgi_command('getFileNames',{path:m_local_root+'/'+path},function(tmp) {
				if (tmp.success=='true') {
					callback(tmp.file_names,{success:true});
				}
				else callback([],{success:false,error:tmp.error});
			});
		}
		else if (cmd=='getFolderNames') {
			localfilecgi_command('getFolderNames',{path:m_local_root+'/'+path},function(tmp) {
				if (tmp.success=='true') {
					callback(tmp.folder_names,{success:true});
				}
				else callback([],{success:false,error:tmp.error});
			});
		}
		else if (cmd=='getFileText') {
			localfilecgi_command('getFileText',{path:m_local_root+'/'+path},function(tmp) {
				if (tmp.success=='true') {
					callback(tmp.text,{success:true});
				}
				else callback('',{success:false,error:tmp.error});
			});
		}
		else if (cmd=='setFileText') {
			localfilecgi_command('setFileText',{path:m_local_root+'/'+path,text:params.text||''},function(tmp) {
				if (tmp.success=='true') {
					callback({success:true});
				}
				else callback({success:false,error:tmp.error});
			});
		}
		else if (cmd=='getFileData') {
			localfilecgi_command('getFileData',{path:m_local_root+'/'+path},function(tmp) {
				if (tmp.success=='true') {
					callback({success:true,data:Base64Binary.decode(tmp.data_base64)});
				}
				else callback({success:false,error:tmp.error});
			});
		}
		else if (cmd=='setFileData') {
			localfilecgi_command('setFileData',{path:m_local_root+'/'+path,data_base64:base64ArrayBuffer(params.data)},function(tmp) {
				if (tmp.success=='true') {
					callback({success:true});
				}
				else callback({success:false,error:tmp.error});
			});
		}
		else if (cmd=='removeFile') {
			localfilecgi_command('removeFile',{path:m_local_root+'/'+path},function(tmp) {
				if (tmp.success=='true') {
					callback({success:true});
				}
				else callback({success:false,error:tmp.error});
			});
		}
		else if (cmd=='gitCommitAll') {
			console.log ('gitCommitAll...');
			localfilecgi_command('gitCommitAll',{path:m_local_root,commit_message:params.commit_message||'',url:m_git_params.url},function(tmp) {
				console.log (tmp.output||'<output undefined>');
				if (tmp.success=='true') {
					callback({success:true});
				}
				else callback({success:false,error:tmp.error});
			});
		}
		else {
			callback({success:false,error:'Unrecognized command: '+cmd});
		}
		
	};
	
	//used by GitFolderImpl
	this.initialize_git_folder=function(git_params,callback) {
		m_git_params=$.extend({},git_params);
		
		
		var url=git_params.url||'';
		if ((url.indexOf('$user$')>=0)&&(url.indexOf('$password$')>=0)) {
			jLogin('Log in to git repository','','','Git log in',function(ret) {
				var user=ret[0]||'';
				var pass=ret[1]||'';
				if ((user)&&(pass)) {
					for (var ct=1; ct<=20; ct++) { //a hack -- replace up to 20 occurances
						url=url.replace('$user$',user);
						url=url.replace('$password$',pass);
						git_params.url=url;
					}
					next_step();
				}
				else {
					callback({success:false,error:'Cancelled by user'});
				}
			});
		}
		else next_step();
		
		function next_step() {
			console.log ('Initializing git...');
			localfilecgi_command('initializeGit',git_params,function(tmp) {
				console.log (tmp.output||'<output undefined>');
				if (tmp.success=='true') {
					callback({success:true,path:tmp.path});
				}
				else {
					callback({success:false,error:tmp.error});
				}
			});
		}
	};
}
