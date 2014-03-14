require('data:/common/pages/3rdparty/three.js/three.js');
require('data:/common/pages/3rdparty/three.js/trackballcontrols.js');

function Scene3DWidget() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {H=W; /*force square*/ m_width=W; m_height=H; update_layout();};
	this.setSceneDiameter=function(diam) {m_scene_diameter=diam;};
	this.setSceneOrigin=function(origin) {m_scene_origin=origin;};
	this.initialize=function(callback) {return _initialize(callback);};
	this.addObject=function(object_type,params) {_addObject(object_type,params);};
	this.render=function() {do_render();};
	
	var m_div=$('<div></div>');
	var m_width=0;
	var m_height=0;
	var m_renderer=new THREE.WebGLRenderer({antialias:true});
	var m_camera=null;
	var m_controls=null;
	var m_scene_diameter=100;
	var m_scene_origin=[0,0,0];
	m_div.append(m_renderer.domElement);
	
	var m_scene=null;
	
	function update_layout() {
		m_div.css({width:m_width,height:m_height});
		m_renderer.setSize(m_width,m_height);
	}
	
	function _initialize(callback) {
		if (m_scene) {
			for ( var i = m_scene.children.length - 1; i >= 0 ; i -- ) {
				var obj = m_scene.children[i];
				m_scene.remove(obj);
				if (obj.geometry) obj.geometry.dispose();
				if (obj.material) obj.material.dispose();
				//obj.deallocate(); 
			}
		}
		
		
		m_scene=new THREE.Scene();
		
		//CAMERA
		var VIEW_ANGLE=45,ASPECT=1,NEAR=0.1,FAR=10000; //camera attributes
		m_camera=new THREE.PerspectiveCamera(VIEW_ANGLE,ASPECT,NEAR,FAR);
		// the camera starts at 0,0,0, so pull it back
		m_camera.position.z=270;
		m_controls=new THREE.TrackballControls(m_camera);
		m_controls.target.set(0,0,0);
		m_controls.addEventListener('change',do_render);
		m_scene.add(m_camera);
		
		//LIGHTS
		//m_scene.add(new_point_light(0xEE0000,0,0,0));
		m_scene.add(new_point_light(0x777777,100,100,100));
		m_scene.add(new_point_light(0x777077,100,-100,100));
		m_scene.add(new_point_light(0x707777,-100,100,100));
		m_scene.add(new_point_light(0x707077,-100,-100,100));
		m_scene.add(new_point_light(0x777777,100,100,-100));
		m_scene.add(new_point_light(0x777077,100,-100,-100));
		m_scene.add(new_point_light(0x707777,-100,100,-100));
		m_scene.add(new_point_light(0x707077,-100,-100,-100));
		function new_point_light(col,x,y,z) {
			var light=new THREE.PointLight(col);
			light.position.x=x;
			light.position.y=y;
			light.position.z=z;
			return light;
		}
		
		
		update_layout();
		
		if (callback) callback();
	}
	
	function _addObject(object_type,params) {
		if (!m_scene) return;
		
		if (object_type=='quad') {
			m_scene.add(new_quad_mesh(params.points,params.color));
		}
		else if (object_type=='tri') {
			m_scene.add(new_tri_mesh(params.points,params.color));
		}
	}
	function new_quad_mesh(points,col) {
		var geometry = new THREE.Geometry();
		for (var i=0; i<points.length; i++) {
			var pt0=points[i];
			pt0=to_scene_coords(pt0);
			var v0=new THREE.Vector3(pt0[0],pt0[1],pt0[2]);
			geometry.vertices.push(v0);
		}
		geometry.faces.push(new THREE.Face3(0,2,1));
		geometry.faces.push(new THREE.Face3(0,3,2));
		geometry.computeFaceNormals();
		var material=new THREE.MeshLambertMaterial({color:col});
		//var material=new THREE.MeshNormalMaterial({color:col});
		//material.side=THREE.DoubleSide;
		var quad0=new THREE.Mesh(geometry,material);
		return quad0;
	}
	function new_tri_mesh(points,col) {
		var geometry = new THREE.Geometry();
		for (var i=0; i<points.length; i++) {
			var pt0=points[i];
			pt0=to_scene_coords(pt0);
			var v0=new THREE.Vector3(pt0[0],pt0[1],pt0[2]);
			geometry.vertices.push(v0);
		}
		geometry.faces.push(new THREE.Face3(0,2,1));
		geometry.computeFaceNormals();
		var material=new THREE.MeshLambertMaterial({color:col});
		//var material=new THREE.MeshNormalMaterial({color:col});
		//material.side=THREE.DoubleSide;
		var quad0=new THREE.Mesh(geometry,material);
		return quad0;
	}
	function to_scene_coords(pt) {
		if (!m_scene) return [0,0];
		var ret=[(pt[0]-m_scene_origin[0])/m_scene_diameter*100,(pt[1]-m_scene_origin[1])/m_scene_diameter*100,(pt[2]-m_scene_origin[2])/m_scene_diameter*100];
		return ret;
	}
	
	function do_render() {
		if (!m_scene) return;
		if (!m_camera) return;
		m_renderer.render(m_scene,m_camera);
	}
	
	function animate_step() {
		//istep++;
		if (m_controls) m_controls.update();
		setTimeout(function() {
			requestAnimationFrame(animate_step);           
		},100);
	}
	animate_step();
}