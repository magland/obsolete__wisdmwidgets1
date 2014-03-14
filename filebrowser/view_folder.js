function view_folder(path,wisdmview_data) {	
	var view_type=wisdmview_data.view_type||'';
	if (view_type=='fmriactivationset') {
		window.open('$approot$/../../frbview/frbview.html?node='+Wisdm.sessionNode+'&path='+path,'_blank');
	}
}