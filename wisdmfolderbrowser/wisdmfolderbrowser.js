require('wisdmwidgets1:/treetable/treetablemodelview.js');
require('wisdmwidgets1:/filebrowser/view_file.js');
require('wisdmwidgets1:/filebrowser/view_folder.js');
require('wisdmfolder.js');

function WisdmFolderBrowser(folder_type,start_base_path) {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H; do_layout();};
	this.setFolder=function(folder) {m_wisdm_folder=folder;};
	this.setBasePath=function(path) {m_base_path=path;};
	this.setPath=function(path) {_setPath(path);};
	this.setFilesViewable=function(val) {m_files_viewable=val;};
	this.path=function() {return m_path;};
	this.refresh=function() {m_tree.refresh(); do_layout();};
	this.onOpenFile=function(callback) {m_div.bind('open-file',function(evt,obj) {callback(obj);});};
	this.onPathChanged=function(callback) {m_div.bind('path-changed',function(evt,obj) {callback(obj);});};
	this.currentFilePath=function() {return _currentFilePath();};
	this.setUploadTypes=function(upload_types) {m_upload_types=[]; for (var i=0; i<upload_types.length; i++) if (upload_types[i]!=='') m_upload_types.push(upload_types[i]);};
	this.onSelectedFolderChanged=function(callback) {m_div.bind('selected-folder-changed',function(evt,obj) {callback(obj);});};
	this.currentFolderPath=function() {return _currentFolderPath();};
	
	this.onCreateApp=function(callback) {m_div.bind('on-create-app',function(evt,obj) {callback(obj);}); m_on_create_app_called=true;};
	
	var m_div=$('<div style="position:absolute"></div>');
	var m_wisdm_folder=new WisdmFolder('node');
	var m_base_path='data:';
	var m_path='data:';
	var m_width=0;
	var m_height=0;
	var m_title_height=20;
	var m_tool_height=20;
	var m_upload_types=[];
	var m_tree=new TreeTableModelView({canSort:false});
	var m_title_div=$('<div><span id=current_path></span> </div>');
	var m_tool_div=$('<div><a href="#" id=refresh_button title="Refresh the list of files/folders.">Refresh</a> <a href="#" id=upload_button style="display:none">Upload</a></div>');
	var m_files_viewable=true;
	m_div.append(m_title_div);
	m_div.append(m_tree.div());
	m_div.append(m_tool_div);
	var m_on_create_app_called=false;
	
	m_tree.onItemActivated(function(item0) {
		if (item0.item_type=='folder') {
			that.setPath(item0.folder_path);
			that.refresh();
		}
		else if (item0.item_type=='file') {
			do_open_file(item0.file_path);
		}
	});
	m_tree.onCurrentItemChanged(function() {
		var it0=m_tree.currentItem();
		if (!it0) return;
		if (it0.item_type=='folder') {
			m_div.trigger('selected-folder-changed',it0.folder_path);
		}
	});
	
	function _setPath(path) {
		if (path!==m_path) {
			m_path=path;
			m_div.trigger('path-changed',m_path);
		}
	}
	
	
	function do_open_file(fname,params) {
		if (!params) params={};
		var suf=utils.get_file_suffix(fname);
		var editable_suffixes=['','txt','h','cpp','c','cxx','hpp','wdoc','pro','html','m','ws','ini','json','xml','html','css','js','R'];
		
		if (editable_suffixes.indexOf(suf)>=0) {
			m_div.trigger('open-file',fname);
		}
		else {
			if (m_files_viewable) {
				if ((suf=='mda')||(suf=='nii')||(suf=='hdr')||(suf=='img')||(suf=='par')||(suf=='jpg')) {
					//Wisdm.waitForOutput({path:fname,timeout:60000},function(tmp) {
						//if (tmp.ready=='true') {
							view_file(fname,{});
							return;
						//}
					//});
				}
				else if (suf=='wp') {
					view_file(fname,params);
					return;
				}
			}
			//m_div.trigger('open-file',fname);
		}
	}
	
	
	
	var model={
		getColumnLabels:function(callback) {
			callback(['Name','Type']);
		},
		getChildItems:function(parent,callback) {
			var path=m_path;
			if (parent!==null) {
				path=parent.folder_path;
			}
			m_wisdm_folder.getFileNames(path,function(files,tmp01) {
			m_wisdm_folder.getFolderNames(path,function(dirs,tmp02) {
				var ret=[];
				if ((m_base_path!==m_path)&&(parent===null)) {
					var it0={
						labels:['..',''],
						is_parent:true,
						item_type:'folder',
						folder_path:utils.get_file_path(path),
						disable_expand:true
					};
					it0.id=it0.folder_path;
					ret.push(it0);
				}
				if ((tmp01.success)&&(tmp02.success)) {
					for (var j=0; j<dirs.length; j++) {
						(function() {
							var it0={
								labels:[dirs[j],'folder'],
								is_parent:true,
								item_type:'folder',
								folder_path:path+'/'+dirs[j]
							};
							it0.id=it0.folder_path;
							
							it0.buttons=[];
							var BB0;
							
								BB0=$('<div class="fb_button view_button" title="Launch view"></div>');
								BB0.attr('folder_path',it0.folder_path);
								BB0.click(function() {
									on_view_folder($(this).attr('folder_path'),$(this).attr('wisdmview_data'));
								});
								BB0.hide();
									m_wisdm_folder.getFileText(it0.folder_path+'/wisdmview.json',function(text,tmp) {
									if (tmp.success) {
										try {
											var params=JSON.parse(text);
											if ((params.view_type||'')!=='') {
												BB0.show();
												BB0.attr('wisdmview_data',text);
											}
										}
										catch(err) {
										}
									}
								});
								it0.buttons.push(BB0);
							
							
							ret.push(it0);
						})();
					}
					for (var j=0; j<files.length; j++) {
						(function() {
							var suf0=utils.get_file_suffix(files[j]);
							var fname0=utils.get_file_name(files[j]);
							var type0=get_type_from_suffix(suf0);
							//if ((suf0=='mda')||(suf0=='nii')||(suf0=='mat')) 
								//type0='<a href="#" onclick="WisdmFolderBrowser.download_file(\''+path+'/'+files[j]+'\');" title="download file">(+)</a> '+type0;
							var it0={
								labels:[files[j],type0],
								is_parent:false,
								item_type:'file',
								file_path:path+'/'+files[j],
								buttons:[]
							};
							it0.id=it0.file_path;
							if (m_on_create_app_called) {
								if ((suf0=='html')&&(fname0.indexOf('.js.html')<0)) {
									var BB1=$('<div class="fb_button create_app_button" title="Create app"></div>');
									it0.buttons.push(BB1);
									BB1.click(function() {
										m_div.trigger('on-create-app',it0.file_path);
									});
								}
							}
							ret.push(it0);
						})();
					}
				}
				callback(ret);
			});});
		}
	};
	
	
	
	function _currentFilePath() {
		if (m_tree.currentItem()) return m_tree.currentItem().file_path||'';
		else return '';
	}
	function _currentFolderPath() {
		if (m_tree.currentItem()) return m_tree.currentItem().folder_path||'';
		else return '';
	}
	
	function do_layout() {
		m_div.css({width:m_width,height:m_height});
		m_tree.setSize(m_width,m_height-m_title_height-m_tool_height);
		m_tree.div().css({left:0,top:m_title_height+m_tool_height});
		m_title_div.css({left:0,right:0,top:0,height:m_title_height,position:'absolute',overflow:'hidden'});
		m_title_div.find('#current_path').html(m_path);
		m_title_div.find('#current_path').attr('title',m_path);
		m_tool_div.css({left:0,right:0,top:m_title_height,height:m_tool_height,position:'absolute',overflow:'hidden'});
		if (m_upload_types.length>0) {
			m_tool_div.find('#upload_button').show();
		}
		else {
			m_tool_div.find('#upload_button').hide();
		}
	}
	
	
	
	function get_type_from_suffix(suf) {
		if (suf=='ws') return 'script';
		else if (suf=='h') return 'C++ header';
		else if (suf=='cpp') return 'C++ source';
		else if (suf=='m') return 'octave script';
		else if (suf=='txt') return 'text file';
		else if (suf=='pri') return 'project file';
		else if (suf=='mda') return 'multi-dimensional array';
		else if ((suf=='nii')||(suf=='hdr')||(suf=='img')) return 'nifti image';
		else if (suf=='R') return 'R script';
		else return '';
	}
	
	function on_view_folder(path,wisdmview_data) {
		view_folder(path,JSON.parse(wisdmview_data));
	}
	function on_upload(callback) {
		var FF=new FileUploader();
		function do_upload_file(indx) {
			if (indx>=FF.fileCount()) {
				that.refresh();
				return;
			}
			else {
				var file_name=FF.fileName(indx);
				m_wisdm_folder.setFileData(m_path+'/'+file_name,FF.fileData(index),function(tmp) {
					if (tmp.success) {
						FF.setFileUploadedToServer(indx);
						do_upload_file(indx+1);
					}
					else {
						callback({success:false,error:tmp.error});
					}
				});
			}
		}
		FF.onFilesLoaded(function() {
			do_upload_file(0);
		});
		FF.showUploadDialog({});
	}
	
	m_tree.setModel(model);
	
	m_tool_div.find('#refresh_button').click(that.refresh);
	m_tool_div.find('#upload_button').click(on_upload);
	
	if (folder_type) {
		that.setFolder(new WisdmFolder(folder_type));
		if (start_base_path) {
			that.setBasePath(start_base_path);
			that.setPath(start_base_path);
		}
	}
}
WisdmFolderBrowser.show_history=function(path0) {
	var url0='$approot$/../../processhistoryview/processhistoryview.html?node='+Wisdm.sessionNode+'&path='+path0;
	window.open(url0,'_blank');
};
WisdmFolderBrowser.download_file=function(path0) {
	Wisdm.downloadFile({path:path0});
};
