require('data:/common/pages/widgets/scene3dwidget/scene3dwidget.js');

document.onWisdm=function() {
	
	var W=new Scene3DWidget();
	W.setSceneDiameter(100);
	
	W.setSize(300,300);
	$('#content').append(W.div());
	
	W.initialize(function() {
		for (var z=-50; z<=50; z+=10) {
			var ww=50;
			if (z>0) {
				W.addObject('quad',{points:[[-ww,-ww,z],[-ww,ww,z],[ww,ww,z],[ww,-ww,z]],color:'rgb(100,100,'+(3*z)+')'});
			}
			else {
				W.addObject('quad',{points:[[-ww,-ww,z],[ww,-ww,z],[ww,ww,z],[-ww,ww,z]],color:'rgb(100,'+(-3*z)+',100)'});
			}
		}
		W.render();
	});
};
