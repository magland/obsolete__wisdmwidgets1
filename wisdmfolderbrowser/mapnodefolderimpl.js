function MapNodeFolderImpl() {
	var that=this;
	
	var m_node={};
	
	this.initialize=function(params,callback) {
		m_node=params.node;
		if (callback) callback();
	};
	
	this.command=function(cmd,params,callback) {
		
		if (!callback) callback=function() {};
		
		var path=params.path||'';
		
		if (cmd=='getFileTree') {
			var node1=find_node_from_path(m_node,path);
			if (!node1) {
				callback([],{success:false,error:'Unable to find node'});
				return;
			}
			
			var file_tree=[];
			get_file_tree_at_node(file_tree,node1,'');
			callback(file_tree,{success:true});
		}
		else if (cmd=='getFileNames') {
			var node1=find_node_from_path(m_node,path);
			if (!node1) {
				callback([],{success:false,error:'Unable to find node'});
				return;
			}
			
			var ret=[];
			for (var i=0; i<node1.children.length; i++) {
				var cc=node1.children[i];
				if ((has_attachment(cc))&&(!has_children(cc))) {
					ret.push(cc.title);
				}
			}
			callback(ret,{success:true});
		}
		else if (cmd=='getFolderNames') {
			var node1=find_node_from_path(m_node,path);
			if (!node1) {
				callback([],{success:false,error:'Unable to find node'});
				return;
			}
			
			var ret=[];
			for (var i=0; i<node1.children.length; i++) {
				var cc=node1.children[i];
				if (has_children(cc)) {
					ret.push(cc.title);
				}
			}
			callback(ret,{success:true});
		}
		else if (cmd=='getFileText') {
			var node1=find_node_from_path(m_node,path);
			if (!node1) {
				callback('',{success:false,error:'Unable to find node'});
				return;
			}
			
			if (!has_attachment(node1)) {
				callback('',{success:false,error:'Node does not have attachment'});
				return;
			}
			
			var txt=node1.attachment.content;
			callback(txt,{success:true});
		}
		else if (cmd=='setFileText') {
			if (!create_path_for_file(m_node,path)) {
				callback('',{success:false,error:'Unable to create path for file: '+path});
				return;
			}
			
			var node1=find_node_from_path(m_node,path);
			if (!node1) {
				callback('',{success:false,error:'Unable to find node'});
				return;
			}
			
			if (!node1.attachment) node1.attachment={contentType:'text/plain',content:''};
			node1.attachment.content=params.text||'';
			callback({success:true});
		}
		else if (cmd=='getFileData') {
			callback('',{success:false,error:'getFileData not yet implemented for mapnodefolder'});
		}
		else if (cmd=='setFileData') {
			callback('',{success:false,error:'setFileData not yet implemented for mapnodefolder'});
		}
		else if (cmd=='removeFile') {
			var filename=utils.get_file_name(path);
			var parpath=utils.get_file_path(path);
			var parnode=find_node_from_path(m_node,parpath);
			if (!parnode) {
				callback({success:false,error:'Unable to find node'});
				return;
			}
			var ccc=parnode.children||[];
			var new_children=[];
			for (var i=0; i<ccc.length; i++) {
				if ((ccc[i].title||'')!=filename) {
					new_children.push(ccc[i]);
				}
			}
			parnode.children=new_children;
			callback({success:true});
		}
		else if (cmd=='setNodeAttributes') {
			var node1=find_node_from_path(m_node,path);
			if (!node1) {
				callback('',{success:false,error:'Unable to find node'});
				return;
			}
			node1.attributes=$.extend({},node1.attributes||{},params.attributes||{});
		}
		else {
			callback({success:false,error:'Unrecognized command: '+cmd});
		}
		
	};
	
	function create_path_for_file(refnode,path) {
		if (path==='') return true;
		var ind=path.indexOf('/');
		var path1,path2;
		if (ind<0) {
			path1=path;
			path2='';
		}
		else {
			path1=path.slice(0,ind);
			path2=path.slice(ind+1);
		}
		
		var the_child=null;
		if (!refnode.children) refnode.children=[];
		var ccc=refnode.children;
		for (var i=0; i<ccc.length; i++) {
			if (ccc[i].title==path1) the_child=ccc[i];
		}
		if (!the_child) {
			the_child={title:path1,collapsed:true};
			ccc.push(the_child);
		}
		return create_path_for_file(the_child,path2);
	}
	
	function has_attachment(node) {
		if (!node.attachment) return false;
		if (!(node.attachment.content)) return false;
		return true;
	}
	function has_children(node) {
		if (!node.children) return false;
		if (node.chilren.length===0) return false;
		return true;
	}
	
	function find_node_from_path(ref_node,path) {
		if (path==='') return ref_node;
		var ind=path.indexOf('/');
		var path1,path2;
		if (ind<0) {
			path1=path;
			path2='';
		}
		else {
			path1=path.slice(0,ind);
			path2=path.slice(ind+1);
		}
		var the_child=null;
		var ccc=ref_node.children||[];
		for (var i=0; i<ccc.length; i++) {
			if (ccc[i].title==path1) the_child=ccc[i];
		}
		if (!the_child) return null;
		return find_node_from_path(the_child,path2);
	}
	
	
	function append_path(path1,path2) {
		if (!path1) return path2;
		if (!path2) return path1;
		return path1+'/'+path2;
	}
	function get_file_tree_at_node(file_tree,node,relpath) {
		var ccc=node.children||[];
		for (var i=0; i<ccc.length; i++) {
			var title=ccc[i].title||'';
			var att0=(ccc[i].attachment||{}).content||'';
			if ((att0.length>0)&&(title)) {
				var md5_at_last_sync=null;
				if ((ccc[i].attributes)&&(ccc[i].attributes.md5_at_last_sync)) md5_at_last_sync=ccc[i].attributes.md5_at_last_sync;
				file_tree[append_path(relpath,title)]={size:att0.length,md5:md5(att0).toString(),md5_at_last_sync:md5_at_last_sync};
			}
			var ccc2=ccc[i].children||[];
			if ((ccc2.length>0)&&(title)) {
				get_file_tree_at_node(file_tree,ccc[i],append_path(relpath,title));
			}
		}
	}
	
}
