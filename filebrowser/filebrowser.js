require('pages:/widgets/treetable/treetablemodelview.js');
require('view_file.js');
require('view_folder.js');

function FileBrowser() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H; do_layout();};
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
	
	var model={
		getColumnLabels:function(callback) {
			callback(['Name','Type']);
		},
		getChildItems:function(parent,callback) {
			var path=m_path;
			if (parent!==null) {
				path=parent.folder_path;
			}
			Wisdm.fileSystemCommand({command:'ls',working_path:path},function(tmp) {
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
				if (tmp.success=='true') {
					for (var j=0; j<tmp.dirs.length; j++) {
						(function() {
							var it0={
								labels:[tmp.dirs[j],'folder'],
								is_parent:true,
								item_type:'folder',
								folder_path:path+'/'+tmp.dirs[j]
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
									Wisdm.getFileData({path:it0.folder_path+'/wisdmview.json',mode:'text'},function(tmp) {
									if (tmp.success=='true') {
										try {
											var params=JSON.parse(tmp.data);
											if ((params.view_type||'')!=='') {
												BB0.show();
												BB0.attr('wisdmview_data',tmp.data);
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
					for (var j=0; j<tmp.files.length; j++) {
						(function() {
							var suf0=utils.get_file_suffix(tmp.files[j]);
							var fname0=utils.get_file_name(tmp.files[j]);
							var type0=get_type_from_suffix(suf0);
							//if ((suf0=='mda')||(suf0=='nii')||(suf0=='mat')) 
								//type0='<a href="#" onclick="FileBrowser.download_file(\''+path+'/'+tmp.files[j]+'\');" title="download file">(+)</a> '+type0;
							var it0={
								labels:[tmp.files[j],type0],
								is_parent:false,
								item_type:'file',
								file_path:path+'/'+tmp.files[j],
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
			});
		}
	};
	
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
				Wisdm.setFileData({path:m_path+'/'+file_name,data:FF.fileData(indx)},function(tmp) {
					if (tmp.success=='true') {
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
}
FileBrowser.show_history=function(path0) {
	var url0='$approot$/../../processhistoryview/processhistoryview.html?node='+Wisdm.sessionNode+'&path='+path0;
	window.open(url0,'_blank');
};
FileBrowser.download_file=function(path0) {
	Wisdm.downloadFile({path:path0});
};

