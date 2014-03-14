function FileUploadWidget() {
	var that=this;
	
	this.setUploadDirectory=function(directory) {m_upload_directory=directory;};
	this.setFileSizeLimit=function(bytes) {m_max_file_bytes=bytes;};
	this.setMultipleFilesMode=function(val) {m_multiple_files_mode=val;};
	this.showDialog=function() {_showDialog();};
	this.onUpload=function(callback) {m_on_upload_handlers.push(callback);};
	
	var m_upload_directory='';
	var m_max_file_bytes=1*1000*1000;
	var m_multiple_files_mode=false;
	var m_dialog=null;
	var m_on_upload_handlers=[];
	var m_current_num_files=0;
	var m_current_file_index=0;
	var m_upload_paths=[];
	
	function _showDialog() {
		var button;
		if (m_multiple_files_mode)
			button=$('<input type="file" name="files[]" label="Upload" multiple></input>');
		else
			button=$('<input type="file" name="files[]" label="Upload"></input>');
		
		button.change(function(evt) {on_upload(evt);});
		
		//Popup
		var W=600;
		var H=90;
		var label0='Upload files';
		if (!m_multiple_files_mode) label0='Upload file';
		
		m_dialog=$('<div id="dialog"></div>');
		var X0=$('<div></div>');
		
		X0.css('position','absolute');
		X0.css('width',W);
		X0.css('height',H);
		//Popup Basic Content
		X0.append('<p><span id="label"></span></p>');
		X0.append('<p><span id="upload_button"></span></p>');
		X0.append('<p id="prog_evol"><progress id="progress" max="100" value="0"></progress><span id="more_button"></span></p>');
		
		X0.find('#label').text(label0);
		X0.find('#upload_button').append(button);
		X0.find('#prog_evol').hide();
		m_dialog.css('overflow','hidden');
		m_dialog.append(X0);
		$('body').append(m_dialog);
		m_dialog.dialog({width:W+20,
										height:H+60,
										resizable:false,
										modal:true,
										title:label0});
	}
	
	function on_upload(evt) {
		m_dialog.find('#upload_button').hide();
		m_dialog.find('#prog_evol').show();
		
		//Wisdm.resetImportFileBytesUploaded();
		
		var files=evt.target.files;
		m_current_num_files=files.length;
		
		function do_read(ind) {
			if (ind<files.length) {
				read_file(files[ind],function(data0) {
					var file_name=files[ind].fileName||files[ind].name;
					if (!data0) {
						jAlert('Problem reading file: '+file_name);
						m_dialog.dialog('close');
						return;
					}
					console.log(data0);
					console.log('uploading file with # bytes = '+data0.byteLength);
					if (data0.byteLength>m_max_file_bytes) {
						jAlert('File size exceeds maximum: '+Math.floor(data0.byteLength/1000)+' > '+Math.floor(m_max_file_bytes/1000)+' KB');
						m_dialog.dialog('close');
						return;
					}
					m_current_file_index=ind;
					var path0=m_upload_directory+'/'+file_name;
					m_upload_paths.push(path0);
					Wisdm.setFileData({path:path0,data:data0,on_progress:on_progress},function(tmp1) {
						if (tmp1.success=='true') {
							setTimeout(function() {do_read(ind+1);},10); //read the next file
						}
						else {
							jAlert('Problem uploading file: '+file_name+': '+tmp1.error);
						}
					});					
				});
			}
			else {
				m_dialog.dialog('close');
				for (var i=0; i<m_on_upload_handlers.length; i++) {
					m_on_upload_handlers[i](m_upload_paths);
				}
			}
		}
		do_read(0);
	}
	function on_progress(bytes_uploaded,total_bytes) {
		m_dialog.find('#progress').val(Math.floor(bytes_uploaded/total_bytes*100));
		var txt0='';
		if (m_current_num_files>1) {
			txt0+='File '+(m_current_file_index+1)+'/'+m_current_num_files+' ';
		}
		txt0+=Math.floor(bytes_uploaded/1000)+' of '+Math.floor(total_bytes/1000)+' KB uploaded...';
		m_dialog.find('#label').html(txt0);
	}
	function read_file(file0,callback) {
		var reader=new FileReader();
		reader.onload=function(ee) {
			var data0 = ee.target.result;
			callback(data0);
		};
		reader.readAsArrayBuffer(file0);
	}
	
	
}