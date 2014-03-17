require('localfolderimpl.js');

function GitFolderImpl() {
	var that=this;

	var m_local_folder=new LocalFolderImpl();
	var m_local_folder_initialized=false;
	var m_params={};
	
	this.initialize=function(params) {
		m_params=$.extend({},{branch:'master'},params);
	};
	
	this.command=function(cmd,params,callback) {
		
		if (!callback) callback=function() {};
		
		initialize_local_folder_if_needed(next_step);
		
		function next_step(tmp) {
			if (tmp.success) {
				m_local_folder.command(cmd,params,callback);
			}
			else {
				//okay, this is kind of hacky... we need to return the result in both the first and second parameters, because sometimes this argument is expected as the second output. :(
				callback({success:false,error:tmp.error},{success:false,error:tmp.error});				
			}
		}
		
	};
	
	var m_initializing_local_folder=false;
	var m_local_folder_initialization_error='';
	function initialize_local_folder_if_needed(callback) {
		if (m_local_folder_initialized) {
			callback({success:true});
			return;
		}
		
		if (m_local_folder_initialization_error) {
			callback({success:false,error:m_local_folder_initialization_error});
			return;
		}
		
		if (m_initializing_local_folder) {
			setTimeout(function() {
				initialize_local_folder_if_needed(callback);
			},500);
			return;
		}
		
		m_initializing_local_folder=true;
		m_local_folder.initialize_git_folder(m_params,function(tmp1) {
			if (tmp1.success) {
				m_local_folder.initialize({path:tmp1.path});
				m_local_folder_initialized=true;
				m_initializing_local_folder=false;
				callback({success:true});
			}
			else {
				m_initializing_local_folder=false;
				m_local_folder_initialization_error='Error initializing git folder: '+tmp1.error;
				callback({success:false,error:m_local_folder_initialization_error});
			}
		});
		
	}
}
