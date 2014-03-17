require('temporaryfolderimpl.js');
require('localfolderimpl.js');
require('nodefolderimpl.js');
require('mapnodefolderimpl.js');
require('gitfolderimpl.js');

function WisdmFolder(folder_type,params) {
	var that=this;
	
	this.getFileTree=function(path,callback) {return m_implementation.command('getFileTree',{path:full_path(path)},callback);};
	this.getFileNames=function(path,callback) {return m_implementation.command('getFileNames',{path:full_path(path)},callback);};
	this.getFolderNames=function(path,callback) {return m_implementation.command('getFolderNames',{path:full_path(path)},callback);};
	this.getFileText=function(path,callback) {return m_implementation.command('getFileText',{path:full_path(path)},callback);};
	this.setFileText=function(path,text,callback) {return m_implementation.command('setFileText',{path:full_path(path),text:text},callback);};
	this.getFileData=function(path,callback) {return m_implementation.command('getFileData',{path:full_path(path)},callback);};
	this.setFileData=function(path,data,callback) {return m_implementation.command('setFileData',{path:full_path(path),data:data},callback);};
	this.removeFile=function(path,callback) {return m_implementation.command('removeFile',{path:full_path(path)},callback);};
	this.subfolder=function(path) {return _subfolder(path);};
	this.specialCommand=function(cmd,params,callback) {return m_implementation.command(cmd,params,callback||function() {});};
	
	var m_implementation=null;
	var m_base_path='';
	var m_params=params||{};
	var m_folder_type=folder_type||'temporary';
	
	function initialize() {
		m_base_path=m_params.base_path||'';
		if (folder_type=='local') {
			m_implementation=new LocalFolderImpl();
			m_implementation.initialize(m_params);
		}
		else if (folder_type=='mapnode') {
			m_implementation=new MapNodeFolderImpl();
			m_implementation.initialize(m_params);
		}
		else if (folder_type=='git') {
			m_implementation=new GitFolderImpl();
			m_implementation.initialize(m_params);
		}
		else if (folder_type=='temporary') { //not sure if this is fully implemented
			m_implementation=new TemporaryFolderImpl();
			m_implementation.initialize(m_params);
		}
		else if (folder_type=='node') { //not implemented yet
			m_implementation=new NodeFolderImpl();
			m_implementation.initialize(m_params);
		}
		else {
			if (m_params.implementation) {
				m_implementation=m_params.implementation;
			}
			else {
				console.log ('Error: Unknown folder type: '+folder_type);
			}
		}
	}
	initialize();
	
	function full_path(path) {
		if (path==='') return m_base_path;
		if (m_base_path==='') return path;
		return m_base_path+'/'+path;
	}
	
	function _subfolder(path) {
		var X=new WisdmFolder();
		X.initialize('',{implementation:m_implementation,base_path:full_path(path)});
		return X;
	}
}
