require('selector.js');
require('treetable.js');
require('$wisdmpages$/core/style/wisdmstyle.js');

function TreeTableModelView(options) {
	
	if (!options) options={};
	options=$.extend({},{
		canSort:false
	},options);
	
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_div.css({width:W,height:H-20});};
	this.setModel=function(M) {m_model=M;};
	this.setSelectionMode=function(mode) {m_selection_mode=mode;}; //'single' or 'multiple'
	this.refresh=function(callback) {return _refresh.apply(this,arguments);};
	this.currentItem=function() {return m_current_item;};
	this.selectedItems=function() {return _selectedItems.apply(this,arguments);};
	this.setCurrentItem=function(item_id) {return _setCurrentItem.apply(this,arguments);};
	this.expandItem=function(item_id) {return _expandItem.apply(this,arguments);};
	this.onCurrentItemChanged=function(callback) {m_div.bind('current_item_changed',function(e,obj) {callback();});};
	this.onItemActivated=function(callback) {m_div.bind('item_activated',function(e,obj) {callback(obj);});};
	this.onItemClicked=function(callback) {m_div.bind('item_clicked',function(e,obj) {callback(obj);});};
	this.onKeyPressed=function(callback) {m_div.bind('key_pressed',function(e,obj) {callback(obj);});};
	this.expandToItem=function(id_list) {return _expandToItem(id_list);};
	
	
	var m_div=$('<div></div>');
	var m_model={};
	var m_widget=null;
	var m_column_count=0;
	var m_current_item=null;
	var m_model_items_by_id={};
	var m_initialized=false;
	var m_selection_mode='multiple';
	
	m_div.css({position:'absolute',width:400,height:400,overflow:'auto'});
	
	m_div.attr('tabindex','1');
	m_div.css({outline:'none'});
	m_div.keydown(function(evt) {on_key_down(evt);});
	
	var do_expand_item=function(widget_item,callback) {
		if (widget_item.data('retrieved_children')!==true) {
			m_model.getChildItems(widget_item.data('model_item'),function(children0) {
				if (widget_item.data('retrieved_children')===true) return; //this is important so we don't retrieve children twice
				for (var ii=0; ii<children0.length; ii++) {
					add_item_to_widget(children0[ii],widget_item);
				}
				widget_item.data('retrieved_children',true);
				m_widget.expand(widget_item);
				if (callback) callback();
			});
		}
		else {
			m_widget.expand(widget_item);
			if (callback) callback();
		}
	};
	
	var _initialize=function() {
		if (m_initialized) {
			console.log ('WARNING: only initialize once!');
			return;
		}
		m_initialized=true;
		
		//important to bind only once! -- so don't call initialize more than once!
		m_div.bind('expandclicked',function(evt,obj) {
			var item0=obj.$item;
			if (item0.data('retrieved_children')!==true)
				do_expand_item(item0);
		});
		m_div.bind('itemclicked',function(evt,obj) {
			var item0=obj.$item;
			var model_item0=item0.data('model_item');
			if (model_item0.onclick) {
				model_item0.onclick(evt,obj);
			}
			set_current_item(model_item0);
			m_div.trigger('item_clicked',model_item0);
		});
		m_div.bind('itemdblclicked',function(evt,obj) {
			var item0=obj.$item;
			var model_item0=item0.data('model_item');
			m_div.trigger('item_activated',model_item0);
		});
		var set_current_item=function(it0) {
			if (m_current_item) {
				if (m_current_item.id==it0.id) return;
			}
			else if (!it0) return;
			m_current_item=it0;
			m_div.trigger('current_item_changed');
		};
		var do_update_children_of_item=function(item_id) {
			var model_item=m_model_items_by_id[item_id];
			if ((!model_item)||(item_id==='')) {
				that.refresh();
				return;
			}
			var widget_item=model_item.widget_item;
			var widget_item_children=m_widget.getChildren(widget_item);
			for (var ii=0; ii<widget_item_children.length; ii++) {
				m_widget.removeItem(widget_item_children[ii]);
			}
			widget_item.data('retrieved_children',false);
			do_expand_item(widget_item);
		};
		if ('onUpdateChildrenRequired' in m_model) {
			m_model.onUpdateChildrenRequired(function(item_id) {
				do_update_children_of_item(item_id);
			});
		}
	};

	var on_key_down=function(evt) {
		m_div.trigger('key_pressed',evt);
	};
	
	var _setCurrentItem=function(item_id) {
		var model_item=m_model_items_by_id[item_id];
		if (!model_item) return;
		var widget_item=model_item.widget_item;
		if (!widget_item) return;
		m_current_item=model_item;
		m_widget.setSelectedItem(widget_item);
	};
	var _expandItem=function(item_id,callback) {
		var model_item=m_model_items_by_id[item_id];
		if (!model_item) {
			if (callback) callback();
			return;
		}
		var widget_item=model_item.widget_item;
		if (!widget_item) {
			if (callback) callback();
			return;
		}
		do_expand_item(widget_item,callback);
	};
	var _expandToItem=function(id_list) {
		if (id_list.length===0) return;
		var expand_next=function(ii) {
			if (ii>=id_list.length-1) {
				_setCurrentItem(id_list[id_list.length-1]);
			}
			else {
				_expandItem(id_list[ii],function() {
					expand_next(ii+1);
				});
			}
		};
		expand_next(0);
	};
	var _selectedItems=function() {
		if (!m_widget) return [];
		var widget_items=m_widget.getSelected();
		var ret=[];
		for (var ii=0; ii<widget_items.length; ii++) {
			ret.push(widget_items[ii].data('model_item'));
		}
		return ret;
	};
	
	var _refresh=function(callback) {
		if (!m_initialized) _initialize();
		if (m_widget) m_widget.clear();
		m_model_items_by_id={};
		
		if (m_widget) m_widget.clear();
		
		m_model.getColumnLabels(function(column_labels) {
			m_column_count=column_labels.length;
			
			var tmp_column_labels=column_labels.slice(1);
			
			m_model.getChildItems(null,function(top_level_items) {
				
				m_div.empty();
				m_widget=m_div.WisdmTreeTable({
					defaultClass : 'wisdm-table-white',
					firstColumnName: column_labels[0],
					datacolumns : tmp_column_labels,
					canSort: options.canSort,
					selection: m_selection_mode
				});
				
				var timer0=new Date();
				for (var ii=0; ii<top_level_items.length; ii++) {
					add_item_to_widget(top_level_items[ii],null);
				}
				m_widget.doneLoading();
				if (callback) callback();
			});
		});
	};
	
	var add_item_to_widget=function(it,par) {
		var elements=[];
		var empty_strings=[];
		for (var ii=0; ii<it.labels.length; ii++) {
			elements.push($('<span>'+it.labels[ii]+' &nbsp;&nbsp;</span>'));
			empty_strings.push('');
		}
		while (elements.length<m_column_count) {
			elements.push($('<span></span>'));
			empty_strings.push('');
		}

		var ret=m_widget.addItem('',empty_strings.slice(1),par,it.is_parent);
		if (it.disable_expand===true) m_widget.disableExpand(ret);
		for (var kk=0; kk<elements.length; kk++) {
			m_widget.setContent(ret,kk,elements[kk]);
		}
		
		if ('buttons' in it) {
			for (var jj=0; jj<it.buttons.length; jj++) {
				//action_element.append(it.buttons[jj]);
				m_widget.addButton(ret,it.buttons[jj]);
			}
		}
		
		m_model_items_by_id[it.id]=it;
		ret.data('model_item',it);
		m_widget.collapse(ret);
		it.widget_item=ret;
		return ret;
	};
	
	var disable_selection=function(X) {
		X.attr('unselectable', 'on')
		.css({
				'user-select'         : 'none',
				'-webkit-user-select' : 'none',
				'-moz-user-select'    : 'none',   
				'-ms-user-select'     : 'none',
				'-o-user-select'      : 'none'
		})
		.on('selectstart', false);
	};
	disable_selection(m_div);
	
}
