(function($) {
$.fn.selectionHandler = function(options) {
	//Synonyms	
	var that = this,
			$that = $(this);
	
	//Defaults
	$.fn.selectionHandler.defaultOptions = {
		list            : [],
		selectedindices : [],
		selectClass     : ''
	};
	
	options = $.extend({}, $.fn.selectionHandler.defaultOptions, options);

	this.getList = function(){return options.list;};
	this.addItem = function(newitem){options.list.push(newitem);};
	this.clear = function(){ options.list = [];};
	this.setNewList = function(newlist){options.list = newlist;};
	this.getSelectedIndices = function(){return options.selectedindices;};
	this.getSelectedItems = function(){
		var items = [];
		for (var i = 0, i_len = options.selectedindices.length; i < i_len; i++)
			items.push(options.list[options.selectedindices[i]]);
		return items;
	};
	this.itemToggled = function(index, isControlKeyPressed, isShiftKeyPressed, sel_class){_itemToggled(index, isControlKeyPressed, isShiftKeyPressed, sel_class);};
	
	//Private Methods
	var _itemToggled = function(index, isControlKeyPressed, isShiftKeyPressed, sel_class){
		//Different Scenarios
		
		if (!isControlKeyPressed && !isShiftKeyPressed){ //If no special key is pressed, we toggle selection of current item (AND unselect everything else)
			_selectIndexNormal(index);
		}else if (isControlKeyPressed){ //If control key is pressed, we simply toggle the status of the item
			_selectIndexControlPressed(index);
		}else if (isShiftKeyPressed){ //If shift key is pressed, we toggle the status of all the items in between the current and the last one

			//If selected indices is empty, we treat as if no special key was pressed
			if (options.selectedindices.length === 0)
				_selectIndexNormal(index);
			//If not, we start from the last selected index and toggle everything between it
			else
				_selectIndexShiftPressed(index, options.selectedindices[options.selectedindices.length -1]);
		}
		var classtoset = !sel_class ? options.selectClass : sel_class;
		if (classtoset.length > 0)
			_applyClass(classtoset);
	};

	var _selectIndexNormal = function(index){
		//was it previously selected?
		if ($.inArray(index, options.selectedindices) !== -1)
			options.selectedindices = []; //we unselect them all
		else //if not
			options.selectedindices = [index]; //we only select it
	};

	var _selectIndexControlPressed = function(index){
		//was it previously selected?
		var prev_position = $.inArray(index, options.selectedindices); 
		if (prev_position !== -1)
			options.selectedindices.splice(prev_position, 1);//we unselect it
		else //if not
			options.selectedindices.push(index); //we add it to the selection
	};
			
	var _selectIndexShiftPressed = function(new_index, last_index){
		//we toggle the new one but we leave the last one unchanged
		_selectIndexControlPressed(new_index);
		
		//we put them in order (smaller / bigger)		
		var smaller = Math.min(new_index, last_index);
		var bigger = Math.max(new_index, last_index);
		
		//We iterate through each item in between and we toggle positions (as if control was pressed on each of them)
		for (var i = smaller + 1, i_len = bigger; i < i_len; i++){
			_selectIndexControlPressed(i);
		}
	};
	var _applyClass=function(c){
		if (options.selectedindices.length === 0){
			for (var i=0, i_len = options.list.length; i < i_len; i++)
				$(options.list[i]).removeClass(c);
		}else{
			for (var i=0, i_len = options.list.length; i < i_len; i++){
				if ($.inArray(i, options.selectedindices) === -1) //if it should not be selected
					options.list[i].removeClass(c);
				else
					options.list[i].addClass(c);
			}
		}
	};
	return this;
};
})(jQuery);