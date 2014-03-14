(function($) {
$.fn.WisdmTreeTable = function(options) {
	//Synonyms		
	var that = this,
			$that = $(this),
			$loading = $('<tr><td>Loading...</td></tr>'),
			showall = false;

	//Defaults
	$.fn.WisdmTreeTable.defaultOptions = {
		datacolumns                 : [],                                 //Array of content/text that will constitute the header, starting at the second row
		firstColumnName             : 'Name',                             //First column header is treated differently since it contains the tree. Use this parameter to set its name
		parentClass_collapsed       : 'wisdm-table-item-expand',          //Class added to parents when they are collapsed (clicking the button will expand)
		parentClass_expanded        : 'wisdm-table-item-collapse',        //Class added to parents when they are expanded (clicking the button will collapse)
		parentClass                 : 'wisdm-table-parent',               //Class added to all parents
		leafClass                   : 'wisdm-table-leaf',                 //Class added to all leaves
		selectClass                 : 'wisdm-table-item-selected',        //Class added to all selected items
		defaultClass                : 'wisdm-table',                      //Default Class for the whole object (tip: try with wisdm-table-white for a white style!)
		indent                      : 20,                                 //number of pixels to indent each level compared to the previous one
		selection                   : 'multiple',                         //Sets the kind of selection allowed (single, multiple, none), not case sensitive. For selection multiple you'll need to add selector.js
		canSelectParent             : true,                               //Allows parent elements to be selected
		canSelectLeaf               : true,                               //Allows leaf elements to be selected
		canSort                     : true,                               //Enables the sorting buttons (data is still sortable through command line)
		canResize                   : false,                              //UNDER TESTING: resizing is not working properly. Defaulting to false by now  (obc 2/1/13)
		animationSpeed              : 0                                   //Animation speed in ms for the expand/collapse action. Set to 0 for big tables to make them more responsive (otherwise animation *has to* manipulate each cell individually)
	};
	
	options = $.extend({}, $.fn.WisdmTreeTable.defaultOptions, options);
	
	/**
   * Adds a $(<TR>) to the WisdmTable
   * @param name First <TD> value. Text and html Strings are accepted.
   * @param values_array (optional) an array containing the elements/text/html to set on each of the following <TD>'s. It starts on the second one (Since the first one is set by the name parameter)
   * @param $parent (optional) if the table has a hierarchical structure, this parameter defines the $(<TR>)'s parent of this <TR>. If this value is not specified it assumes the item is placed at the top level
   * @param isparent set to true to default to parent element (insead of leaf). It defaults to false.
   * @returns the created $(<TR>)
   */
	this.addItem = function(name, values_array, $parent, isparent){return _addItem(name, values_array, $parent, isparent);};
	/**
   * Adds multiple $(<TR>) to the WisdmTable
   * @param names First <TD> value for each TR. The number of elements in the array will determine the number of elements added. Text and html Strings are accepted.
   * @param $parent (optional) if the table has a hierarchical structure, this parameter defines the $(<TR>)'s parent of ALL defined <TR>. If this value is not specified it assumes the item is placed at the top level<BR/>
   * Note that to add multiple elements with different $parents you will need multiple calls.
   * @param areparents set to true to default to parent elements (insead of leafs). It defaults to false.
   * @returns the created $(<TR>)
   */
	this.addItems = function(names_array, $parent, areparents){return _addItems(names_array, $parent, areparents);};
	/**
   * Sets the content of a column at a specific row
   * @param $item the created $(<TR>) item returned by the addItem method
   * @param columnindex the 0-based index of the column to select. So 0 sets the first column (only text/html Strings allowed). For any other column any element can be added
   * @content the content to set
   * @returns the item ($(<TR>))
   */
	this.setContent = function($item, columnindex, content){return _setContent($item, columnindex, content);};
	/**
   * Sets the content of a header at a specific column
   * @content the content to set
   * @param columnindex (optional) the 0-based index of the column to select. So 0 sets the first column and 0 is the default value if omitted.
   */
	this.setHeader = function(content, columnindex){return _setHeader(content, columnindex);};
	/**
   * Removes a given row from the table. If it is a parent element that contains subitems they will also be removed without notification
   * @param $item the created $(<TR>) item returned by the addItem method
   */
	this.removeItem = function($item){return _removeItem($item);};
	/**
   * Gets the content of a specific column for a given row
   * @param $item the created $(<TR>) item returned by the addItem method
   * @param columnindex the 0-based index of the column to select.
   * @returns the html content of that cell
   */
	this.getContent = function($item, columnindex){return _getContent($item, columnindex);};
	/**
   * @param $item the created $(<TR>) item returned by the addItem method
   * @returns true if the item is a parent element and is collapsed. Returns false otherwise
   */
	this.isCollapsed = function($item){return _isCollapsed($item);};
	/**
   * Note that selection mode has to be 'single' or 'multiple'
   * @param index (optional) the column index to return, if empty it will return the whole item ($(<TR>))
   * @returns an array of the **content** of the <TD> elements at the specified index if it is defined or the whole $(<TR>) that are currently being selected
   */
	this.getSelected = function(index){return _getSelected(index);};
	/**
   * Sorts the children elements of a given parent. It can sort them in ascending or descending order and can also recursively iterate the tree to order subitems aswell
   * @param $item the created $(<TR>) item returned by the addItem method
   * @param columnindex (optional, defaults to 0) the 0-based index of the column to select.
   * @param ascending (optional, defaults to true)
   * @param recursive (optional, defaults to false)
   */
	this.sortChildren = function($item, columnindex, ascending, recursive){return _sortChildren($item, columnindex, ascending, recursive);};
	/**
   * Collapses the children of a parent $(<TR>). This functionality is integrated by default when the user clicks on the .wisdm-table-item-collapsible element
   * @param $item the created $(<TR>) item returned by the addItem method
   */
	this.collapse = function($item){return _collapse($item);};
	/**
   * Collapses all parent $(<TR>)'s
   */
	this.collapseAll = function(){return _collapseAll();};
	/**
   * Expands the children of a parent $(<TR>). This functionality is integrated by default when the user clicks on the .wisdm-table-item-collapsible element
   * @param $item the created $(<TR>) item returned by the addItem method
   */
	this.expand = function($item){return _expand($item);};
	/**
   * Expands all parent $(<TR>)'s
   */
	this.expandAll = function(){return _expandAll();};
	/**
   * Makes the $(<TR>) a parent element (sets the parent classes, removes the leaf classes). The returned $(<TR>) by the addItem method is a leaf by default.<BR/>
   * It will be automatically set to be a parent if children are added to it and it cannot be set to leaf while it has children
   * @param $item the created $(<TR>) item returned by the addItem method
   */
	this.setToParent = function($item){return _setToParent($item);};
	this.setToParents = function(items_array){ return _setToParents(items_array);};
	/**
   * Makes the $(<TR>) a leaf element, this is the default behavior when a $(<TR> is created (sets the leaf classes, removes the parent classes).<BR/>
   * It cannot be set to leaf while it has children.
   * @param $item the created $(<TR>) item returned by the addItem method
   */
	this.setToLeaf = function($item){return _setToLeaf($item);};
	this.setToLeafs = function(items_array){ return _setToLeafs(items_array);};
	/**
   * @param $item the created $(<TR>) item returned by the addItem method
   * @returns whether the current element is a parent element or not. Note that this is different from whether the parent has children. <BR/>
   * To know that you have to call getChildren().length > 0
   */
	this.isParent = function($item){return _isParent($item);};
	/**
   * @param $item the created $(<TR>) item returned by the addItem method
   * @param all (optional), defaults to false, whether it retrieves an array of the direct descendants (false) or all items and subitems (true)
   * @returns an array of children of a given element (it won't return the elements children if they have them, that will have to be queried separately)
   */
	this.getChildren = function($item, all){return all ? _getAllDescendants($item) : _getDirectDescendants($item);};
	/**
   * @param path the path to the $(<TR>) (based on the first column content), '/'-separated (or any other separator character specified) at each indentation level.<BR/>
   * If it is a top level item simply set the name and it will retrieve it (no need to prepend the separating character)
   * @param separator (optional) default assumes '/', the character used to divide folders and subfolders
   * @returns the item that matches the specified path.
   */
	this.getItem = function(path, separator){return _getItem(path, separator);};
	/**
   * @param $item the created $(<TR>) item returned by the addItem method
   * @param separator defaults to '/', the separator between folders and subfolders
   * @returns the path of that item divided by separator
   */
	this.getPath = function($item, separator){return _getPath($item, separator);};
	/**
   * Moves the current item and all its descendants to the path specified by newpath. If the path doesn't exist it will be created.
   * @param $item the created $(<TR>) item returned by the addItem method
   * @param newpath (optional) the newpath (excluding the name, just the path, if not provided it will set the $item at the top level)
   * @param separator (optional) default assumes '/', the character used to divide folders and subfolders
   * @returns the path of that item divided by separator
   */
	this.moveItem = function($item, newpath, separator){_moveItem($item, newpath, separator);};
	/**
   * Removes all the data content (tbody) but keeps the headers
   */
	this.clear = function(){$that.find('tbody').empty();};
	
	/**
   * Removes the "Loading" message if it hasn't already been removed. (Useful for an empty tree); (jfm)
   */
	this.doneLoading=function() {$loading.remove();};
	//removes the expand/collapse button for this item
	this.disableExpand=function($item) {$item.find('.wisdm-table-item-collapsible').remove();}; //jfm
	this.setSelectedItem=function($item) {_selectionChanged({ctrlKey:false,shiftKey:false},$item);}; //jfm 
	this.addButton=function($item,B) { //jfm
		$item.find('td:first span.wisdm-table-item-name').prepend(B);
	};
	
	//Pubic methods
	var _addItem = function(name, values_array, $parent, isparent){
		$loading.remove();
		var $item = _createItem(name, values_array, $parent);
		if (isparent === true)
			that.setToParent($item);
		else
			that.setToLeaf($item);
		_appendItem($item, $parent);
		
		_updateSelector();
		return $item;
	};
	var _addItems = function(names_array, $parent, areparents){
		$loading.remove();
		if (!names_array) return;
		var generated_items = [];
		
		for (var i = 0, i_len = names_array.length; i < i_len; i++){
			var na = names_array[i];
			var $item = _createItem(na, [], $parent);
			generated_items.push($item);
		}
		if (areparents === true)
			that.setToParents(generated_items);
		else
			that.setToLeafs(generated_items);
		_appendItems(generated_items, $parent);
		_updateSelector();
		return generated_items;
	};
	var _setContent = function($item, columnindex, content){
		if (!columnindex) columnindex = 0;
		
		if (columnindex === 0){
			$item
				.attr('data-name', content)
				.data('name', content)
				.find('td:first span.wisdm-table-item-name')
					.empty()
					.append(content);
		}else{
			$item.find('td:nth-child('+(++columnindex)+')')
				.empty()
				.append(content);
				
		}
		return $item;
	};
	var _setHeader = function(content, columnindex){
		if (!columnindex) columnindex = 0;
		$that.find('thead th:nth-child(' + (columnindex+1) + ') span.wisdm-table-header-text')
				.empty()
				.append(content);
	};
	var _removeItem = function($item){
		if (that.isParent($item)){
			var $children = _getAllDescendants($item);
			for (var i = 0 , i_len = $children.length ; i < i_len ; i++)
				$children[i].remove();
		}
		$item.remove();
		_updateSelector();
	};
	var _getContent = function($item, columnindex){
		var $i = columnindex === 0 ? $item.find('td:first span.wisdm-table-item-name') : $item.find('td:nth-child('+(columnindex+1)+')');
		return $i.html();
	};
	var _isCollapsed = function($item){
		return !$item.hasClass(options.parentClass_expanded);
	};
	var _getSelected = function(index){
		var $allitems = _getAllItems('.' + options.selectClass);
		if ($.isNumeric(index)){
			var allitems_td = [];
			for (var i = 0, i_len = $allitems.length; i < i_len; i++)
				allitems_td.push(_getContent($allitems[i], index));
			return allitems_td;
		}else
			return $allitems;
	};
	var _sortChildren = function($item, column, ascending, recursive){
		//sorting function implementation
		var _sorter = function(a,b){
			var $atr = column === 0 ? a.find('td:first span.wisdm-table-item-name') : a.find('td:eq('+column+')'); 
			var $btr = column === 0 ? b.find('td:first span.wisdm-table-item-name') : b.find('td:eq('+column+')');
			var atr = $atr.text().trim().toLowerCase();
			var btr = $btr.text().trim().toLowerCase();
			if (ascending){
				if (atr < btr)
					return -1;
				else if (atr > btr)
					return 1;
				else
					return 0;
			}else{
				if (atr > btr)
					return -1;
				else if (atr < btr)
					return 1;
				else
					return 0;
			}
		};
		
		//sort children method
		if (ascending !== false) ascending = true;
		if (recursive !== true) recursive = false;
		if (!column) column = 0;
		var children = _getDirectDescendants($item);
		
		children = children.sort(_sorter);
		
		for (var i = children.length -1; i >= 0; i--){
			var c = children[i];
			var c_subchildren = _getAllDescendants(c);
				
			if ($item.is('tbody'))
				$item.prepend(c);
			else
				c.insertAfter($item);
			
			for (var j = c_subchildren.length -1; j >= 0; j--){
				c_subchildren[j].insertAfter(c);
			}
			if (c_subchildren.length > 0)
				that.sortChildren(c, column, ascending, recursive);

		}
		_updateSelector();
	};
	var _expand = function($item){
		if (!that.isParent($item)) return;
		$item
			.addClass(options.parentClass_expanded)
			.removeClass(options.parentClass_collapsed);
		
		//We get all the children and then we make a list of the items that need to be expanded (or we just set to collapsed the ones that are collapsed)
		var $children = _getDirectDescendants($item),
				ctoexpand = [],
				__AddSubItemToExpand = function(subitem){
					if(that.isParent(subitem)){
						if (that.isCollapsed(subitem))
							that.collapse(subitem);
						else{
							that.expand(subitem);
							ctoexpand.push(subitem);
						}
					}
				};
		//Now we expand them. How we do that will vary depending on the animation speed. If animation speed is 0 we use a much more efficient approach
		if (options.animationSpeed > 0){
			var unwrap = function(){$(this).contents().unwrap();};
			
			for (var i = 0, i_len = $children.length; i < i_len; i++){
				$children[i]
					.find('td')
						.show()
						.find('div.wisdm-table-animation')
							.slideDown(options.animationSpeed, unwrap);
				__AddSubItemToExpand($children[i]);
			}
		}else{
			for (var j = 0, j_len = $children.length; j < j_len; j++){
				$children[j].show();
				__AddSubItemToExpand($children[j]);
			}
		}
		//Now that the current item is fully expanded, we can expand subitems
		for (var ctoexpand_index = 0, ctoexpand_total = ctoexpand.length; ctoexpand_index < ctoexpand_total; ctoexpand_index++)
			_expand(ctoexpand[ctoexpand_index]);

		return that;
	};
	var _expandAll = function(){
		var $items = _getAllItems('.' + options.parentClass);
		for (var i = 0, i_len = $items.length; i < i_len; i++)
			_expand($items[i]);
	};
	var _collapse = function($item){
		if (!that.isParent($item)) return;
		$item
			.addClass(options.parentClass_collapsed)
			.removeClass(options.parentClass_expanded);
		var $children = _getAllDescendants($item);
		
		if ($children.length === 0) return that;	
		
		if (options.animationSpeed > 0){
			var hider = function(){	$(this).parent().hide(); };
			
			for (var i = 0, i_len = $children.length; i < i_len; i++){
				var $td =$children[i].find('td');
				//this is a bit of a hack but since table rows don't have size, we wrap it all in a div. it's a common fix
				$td.wrapInner('<div class="wisdm-table-animation"></div>').children('div')
					.slideUp(options.animationSpeed, hider); 
			}
		}else
			for (var j = 0, j_len = $children.length; j < j_len; j++)
				$children[j].hide();
		
		return that;
	};
	var _collapseAll = function(){
		var $items = _getAllItems('.' + options.parentClass);
		for (var i = 0, i_len = $items.length; i < i_len; i++)
			_collapse($items[i]);
	};
	var _isParent = function($item){
		return $item.hasClass(options.parentClass);
	};
	var _setToParent = function($item){
		_setToParents([$item]);
	};
	var _setToParents = function(items){
		for (var i = 0, i_len = items.length; i < i_len; i++){
			items[i]
			.data('haschildren',true)
			.removeClass(options.leafClass)
			.addClass(options.parentClass)
			.find('td:first-child span.wisdm-table-item-collapsible')
				.addClass(options.parentClass_expanded);
		}
		//_updateSelector();	
	};
	var _setToLeaf = function($item){
		_setToLeafs([$item]);
	};
	var _setToLeafs = function(items){
		for (var i = 0, i_len = items.length; i < i_len; i++){
			var $item = items[i];
			if (_getAllDescendants($item).length === 0){
				$item
					.removeClass(options.parentClass)
					.addClass(options.leafClass)
					.data('haschildren', false)
					.find('td:first-child span.wisdm-table-item-collapsible')
					.removeClass(options.parentClass_expanded)
					.removeClass(options.parentClass_collapsed);
			}
		}
		_updateSelector();
	};
	
	var _getItem = function(path, separator){
		if (!path) return;
		if (!separator) separator = '/';
		if (path[0] === separator) path = path.substring(1);
		var splitted = path.split(separator);
		var parent = _getAllItems('[data-name="'+splitted[0]+'"][data-level="0"]')[0];
		for (var level = 1, max_level = splitted.length; level < max_level; level++){
			if (!parent) return;
			var children = _getDirectDescendants(parent);
			for (var i = 0, i_len = children.length; i < i_len; i++){
				if (children[i].attr('data-name') === splitted[level])
					parent = children[i];
			}
		}
		if (!parent)
			return;
		else if (parent.data('level') !== (max_level -1))
			return;
		else
			return parent;
	};
	var _getPath = function($item, separator){
		if (!separator) separator = '/';
		
		var folder = $item.data('name');
		for (var i = $item.data('level') -1; i >= 0; i--){
				var $parent = $item.data('$parent');
				folder = $parent.data('name') + separator + folder;
		}
		return folder;
	};
	var _moveItem = function($item, newpath, separator){
		if (!separator) separator = '/';
		if (!newpath) newpath = '';
		//if the destination path is the same than the current path we don't need to do anything
		if (_getPath($item) === newpath) return;
		
		var $children = _getAllDescendants($item);
		for (var i = 0, i_len = $children.length; i < i_len; i++){$children[i].detach();}
		
		var $parent = _getItem(newpath);
		var item_level = __getPathLevel(newpath);
		
		if (!$parent)//if the path doesn't exist, we create it
			$parent = __createPath(newpath);
		
		//Item
		$item.detach(); //we deatach it so it doesn't influence the children count of other elements when moving it.
		_appendItem($item, $parent);
		
		$item.data('$parent', $parent);
		__setItemLevel($item, item_level);
		
		//Descendants
		for (var k = 0, k_len = $children.length; k < k_len; k++)
			_appendItem($children[k], $children[k].data('$parent'));
		
		__setChildrenLevels($children, item_level + 1);
		
		//Visibility
		if (item_level === 0){
			$item                                            //We show the $item
				.find('td')
				.show()
				.find('div.wisdm-table-animation')
					.contents().unwrap();
			_collapse($item);                                //but we hide its descendants
		}else if (_isCollapsed($parent))_collapse($parent);//If the parent is collapsed, we hide it
		else                            _expand($parent);  //If parent is expanded, we show it
	};
	//move item helpers
	var __getPathLevel = function(path){
		if (path === '') return 0;
		
		var level = 1;
		while (path.indexOf('/') !== -1){
			path = path.substring(path.indexOf('/') +1);
			level++;
		}
		return level;
	};
	var __createPath = function(path){
		if (!path) path = '';
		var paths = path.split('/');
		if (paths.length === 0) return;
		else if (paths[0].length === 0) return;
		
		//We get (or create) the first parent element
		var $parent = _getItem(paths[0]);
		if (!$parent) $parent = _addItem(paths[0]);
		
		for (var i = 1, i_len = paths.length; i < i_len; i++){
			//We get all its direct descendants
			var $children_array = _getDirectDescendants($parent);
			
			//and check whether the subitem we are looking for is there
			var found = false;
			for (var j = 0, j_len = $children_array.length; j < j_len; j++){
				if ($children_array[j].data('name') === paths[i]){
					$parent = $children_array[j]; //if so, we set it as the new parent
					found = true;
				}
			}
			if (!found){ //otherwise we create it
				$parent = _addItem(paths[i], [], $parent);
			}
		} //and iterate again
		return $parent; //finally, we return the last item (destination)
	};
	var __setItemLevel = function($item, level){
		$item.data('level', level);
		$item.attr('data-level', level);
		$item.find('td:first').css({
			'padding-left' : options.indent*level+'px'
		});
	};
	var __setChildrenLevels = function($children_array, startinglevel){
		if (!startinglevel) startinglevel = 0;
		if ($children_array.length === 0) return;
		
		var difference = startinglevel - $children_array[0].data('level');
		
		for (var i = 0, i_len = $children_array.length; i < i_len; i++)
			__setItemLevel($children_array[i], $children_array[i].data('level') + difference);
	};
	//Private Methods
	var _appendItem = function($item, $parent){
		if ($parent){
			//find parent using the name and the level
			that.setToParent($parent);
			var children = _getAllDescendants($parent);
			if (children.length === 0)
				$item.insertAfter($parent);
			else{
				$item.insertAfter(children[children.length-1]);
			}
		}else{
			//If no parent is defined we simply attach it to the main level
			$that.find('tbody').append($item);
		}
	};
	var _appendItems = function(items, $parent){
		if ($parent){
			//find parent using the name and the level
			that.setToParent($parent);
			var children = _getAllDescendants($parent);
			if (children.length === 0)
				for (var l = 0, l_len = items.length; l < l_len; l++) items[l].insertAfter($parent);
			else{
				for (var m = 0, m_len = items.length; m < m_len; m++) items[m].insertAfter(children[children.length-1]);
			}
		}else{
			//If no parent is defined we simply attach it to the main level
			var $b = $that.find('tbody');
			for (var i = 0, i_len = items.length; i < i_len; i++) $b.append(items[i]);
		}
	};
	var _getAllItems = function(filter){
		if (!filter) filter = '';
		var items = $that.find('tbody tr'+filter);
		var selectall = [];
		if (items.length === 0) return [];
		$.each(items, function(i,e){
			selectall.push($(e));
		});
		return selectall;
	};
	var _getAllDescendants = function($parent){
		if (!that.isParent($parent) && !$parent.is('tbody')) return [];		
		var childrenlevel = $parent.data('level') + 1;
		//if next item doesn't exist or has the same or a lower level than the parent we return (faster test in case it has no children)
		var $next = $parent.next();
		if (!$next) return [];
		else if ($parent.next().data('level') < childrenlevel) return [];
		
		var children = [];
		
		var stillvalid = true,
				potentialchildren =  childrenlevel === 0 ? _getAllItems() : $parent.nextUntil('tr:last');
		
		$.each(potentialchildren, function(i,e){
			if (stillvalid && $(e).data('level') >= childrenlevel)
				children.push($(e));
			else if ($(e).data('level') < childrenlevel)
				stillvalid = false;
		});
		return children;
	};
	var _getDirectDescendants = function($parent){
		if (!$parent) return _getAllItems();
		
		if (!that.isParent($parent) && !$parent.is('tbody')) return [];
		
		var childrenlevel = $parent.data('level') + 1;
		//if next item doesn't exist or has the same or a lower level than the parent we return (faster test in case it has no children)
		var $next = $parent.next();
		if (!$next) return [];
		else if ($parent.next().data('level') < childrenlevel) return [];

		var children = [];
		
		var potentialchildren = childrenlevel === 0 ? _getAllItems() : $parent.nextUntil('tr:last'),
				stillvalid = true;
		
		$.each(potentialchildren, function(i,e){
			if (stillvalid && $(e).data('level') == childrenlevel)
				children.push($(e));
			else if ($(e).data('level') < childrenlevel)
				stillvalid = false;
		});
		return children;
	};
	var _createItem = function(name, values_array, $parent){
		var level = $parent ? $parent.data('level') + 1 : 0;
		if (!values_array) values_array = [];
		var $item = $('<tr class="' + options.parentClass_expanded + '" data-name="'+name+'" data-level="'+level+'"></tr>');
		var $name = $('<td style="padding-left:'+options.indent*level+'px"><span class="wisdm-table-item-collapsible" style="display: inline-block; *display:inline; zoom:1;"></span><span class="wisdm-table-item-icon" style="display: inline-block; *display:inline; zoom:1;"></span><span class="wisdm-table-item-name">'+name+'</span></td>');

		$item
			.append($name)
			.data('$parent', $parent)
			.data('name', name)
			.data('level', level)
			.click(function(e){
				_selectionChanged(e, $item);
			})
			.dblclick(function(e){
				if (that.isParent($item)) {//condition added by jfm
					//$collapsible.click(); //removed by jfm
				}
			});
		var $collapsible = $item.find('span.wisdm-table-item-collapsible')
			.click(function(e){
				//on expand/collapse button clicked
				if (that.isCollapsed($item))
					that.expand($item);
				else
					that.collapse($item);
				//trigger click event
				$that.trigger('expandclicked',{
					orig_event: e, 
					name: $item.data('name'),
					level: $item.data('level'),
					$item: $item,
					$parent: $item.data('$parent'),
					path: _getPath($item),
					isParent: _isParent($item)
				});
				e.preventDefault();
				return false;
			});
		
		for (var i = 0, i_len = values_array.length; i < i_len; i++)
			$item.append($('<td></td>').append(values_array[i]));
		
		$item
			.click(function(e){
				//trigger click event
				$that.trigger('itemclicked',{
					orig_event: e, 
					name: $item.data('name'),
					level: $item.data('level'),
					$item: $item,
					path: _getPath($item),
					$parent: $item.data('$parent'),
					isParent: _isParent($item)
				});
			});
		$item
			.dblclick(function(e){
				//trigger click event
				$that.trigger('itemdblclicked',{
					orig_event: e, 
					name: $item.data('name'),
					level: $item.data('level'),
					$item: $item,
					path: _getPath($item),
					$parent: $item.data('$parent'),
					isParent: _isParent($item)
				});
			});
		return $item;
	};
	var _selectionChanged = function(e, $item){
		var isparent = that.isParent($item);
		if (isparent && !options.canSelectParent) return;
		else if (!isparent && !options.canSelectLeaf) return;
		
		//on item clicked, selection method changes
		switch(options.selection.toLowerCase()){
			case 'single':
				//We remove all select tags and apply them to this item
				$.each(_getAllItems(), function(i,$e){
					$e
						.removeClass(options.selectClass);
				});
				$item.addClass(options.selectClass);
				break;
			case 'multiple':
				if (options.canSelectParent && !options.canSelectLeaf){
					//We get only parent
					$that.itemToggled($that.find('tbody tr.' + options.parentClass).index($item), e.ctrlKey, e.shiftKey, options.selectClass);
				}else if (options.canSelectLeaf && !options.canSelectParent){
					//We get only children
					$that.itemToggled($that.find('tbody tr.' + options.leafClass).index($item), e.ctrlKey, e.shiftKey, options.selectClass);
				}else if (options.canSelectParent && options.canSelectLeaf){
					if (_isParent($item))
						$that.itemToggled($that.find('tbody tr').index($item), e.ctrlKey, e.shiftKey, options.selectClass);
					else
						$that.itemToggled($that.find('tbody tr').index($item), e.ctrlKey, e.shiftKey, options.selectClass);
				}
				break;
			default:
			case 'none':
				break;
		}
	};
	var _updateSelector = function(){
		if (options.selection.toLowerCase() !== 'multiple') return;

		if (options.canSelectLeaf && !options.canSelectParent)
			//We get only children
			$that.setNewList(_getAllItems('.'+options.leafClass));
		else if (options.canSelectParent && !options.canSelectLeaf)
			//We get only parents
			$that.setNewList(_getAllItems('.'+options.parentClass));
		else if (options.canSelectParent && options.canSelectLeaf)
			//We select all of them
			$that.setNewList(_getAllItems());
		//all other cases we don't select anything
	};
	var _genHeader = function(name, index){
		var $sorter = $('<button class="wisdm-table-header-sort"><span class="ui-icon ui-icon-triangle-2-n-s"></span></button>').
				click(function(){
					$that.find('thead tr span.ui-icon')
						.addClass('ui-icon-triangle-2-n-s');
					
					var $icon = $sorter.find('span.ui-icon');
					var ascending = !$icon.hasClass('ui-icon-triangle-1-n');
					if (ascending){
						$icon
							.removeClass('ui-icon-triangle-2-n-s')
							.removeClass('ui-icon-triangle-1-s')
							.addClass('ui-icon-triangle-1-n');
					}else{
						$icon
							.removeClass('ui-icon-triangle-2-n-s')
							.removeClass('ui-icon-triangle-1-n')
							.addClass('ui-icon-triangle-1-s');
					}
					var recursive = true;
					that.sortChildren($that.find('tbody'), index, ascending, recursive);
				});
		var $header = $('<th><span class="wisdm-table-header-text">'+name+'</span></th>');

		if (options.canSort)
			$header.append($sorter);
		//This allows to position elements in the header with absolute positioning consistently across browsers
		$header.wrapInner($('<div></div>').css({
			'height'   : '15px',
			'width'    : '100%',
			'position' : 'relative'
		}));
		return $header;
	};
	var _makeResizable = function(){
		//based on http://ihofmann.wordpress.com/2012/07/31/resizable-table-columns-with-jquery-ui/
		var $col, colWidth, originalSize;
		
		//create colgroup
		var addendum = '<colgroup>';
		for (var i = 0, i_len = options.datacolumns.length + 1; i < i_len; i++)
			addendum += '<col></col>';
		addendum += '</colgroup>';
		$that.prepend(addendum);
		
		$that.find('th').resizable({
				handles: "e",
				start: function(event, ui) {
					var colIndex = ui.helper.index() + 1;
					$col = $that.find("colgroup > col:nth-child(" + colIndex + ")");
					colWidth = parseInt($col.get(0).style.width, 10); // get col width (faster than .width() on IE)
					if (isNaN(colWidth)) colWidth = $col.width();
						originalSize = ui.size.width;
			},
			resize: function(event, ui) {
				var resizeDelta = ui.size.width - originalSize;
				var newColWidth = colWidth + resizeDelta;
				$col.width(newColWidth);
				$(this).css("height", "auto");// height must be set in order to prevent IE9 to set wrong height
			}
			});
	};
	var initialize = function(){
		$that
			.addClass(options.defaultClass);
		var $tbody = $that.find('tbody');
		if ($tbody.length === 0){
			var $existing_elems = $that.children();
			if ($existing_elems.length !== 0){
				$existing_elems.wrapAll('<tbody></tbody>');
				$tbody = $that.find('tbody');
			}else{
				$tbody = $('<tbody></tbody>').appendTo($that);
			}
		}
		$tbody
			.empty()
			.append($loading)
			.data('level', -1);
		
		//setTimeout(function() {$loading.remove();},5000); //remove after 5 seconds (jfm)
		
		var $thead = $that.find('thead tr');
		if ($thead.length === 0){
			$that.append('<thead><tr></tr></thead>');
			$thead = $that.find('thead tr');
		}
		$thead
			.empty()
			.append(_genHeader(options.firstColumnName, 0));
		
		for (var i = 0, i_len = options.datacolumns.length; i < i_len; i++)
			$thead.append(_genHeader(options.datacolumns[i], i+1));
		
		if (options.selection.toLowerCase() === 'multiple'){
			$that.selectionHandler({ 
				selectClass : options.selectClass
			});
		}
		if (options.canResize)
			_makeResizable();
	};

	initialize();	
	return this;
};
})(jQuery);