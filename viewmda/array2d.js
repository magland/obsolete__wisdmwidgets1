function Array2D(N1,N2) {
	var that=this;
		
	this.allocate=function(N1,N2) {return _allocate.apply(this,arguments);};
	this.copyFrom=function(X) {return _copyFrom.apply(this,arguments);};
	this.transpose=function() {return _transpose.apply(this,arguments);};
	this.N1=function() {return m_N1;};
	this.N2=function() {return m_N2;};
	this.value=function(x,y) {return _value.apply(this,arguments);};
	this.setValue=function(val,x,y) {return _setValue.apply(this,arguments);};
	this.data=function() {return m_data;};
	this.dataX=function(y) {return _dataX.apply(this,arguments);};
	this.dataY=function(x) {return _dataY.apply(this,arguments);};
	this.setDataX=function(data,y) {return _setDataX.apply(this,arguments);};
	this.setDataY=function(data,x) {return _setDataY.apply(this,arguments);};
	this.setData=function(data) {return _setData.apply(this,arguments);};
	this.min=function() {return _min.apply(this,arguments);};
	this.max=function() {return _max.apply(this,arguments);};
	this.scaleBy=function(value) {return _scaleBy(value);};

	var m_N1=0;
	var m_N2=0;
	var m_data=[];
	
	var _allocate=function(N1,N2) {
		m_N1=N1;
		m_N2=N2;
		m_data=new Float32Array(N1*N2);
	};
	var _copyFrom=function(X) {
		that.allocate(X.N1(),X.N2());
		for (var yy=0; yy<X.N2(); yy++) {
			that.setDataX(X.dataX(yy),yy);
		}
	};
	var _transpose=function() {
		var ret=new Array2D(that.N2(),that.N1());
		for (var yy=0; yy<that.N2(); yy++)
		for (var xx=0; xx<that.N1(); xx++) {
			ret.setValue(that.value(xx,yy),yy,xx);
		}
		return ret;
	};
	var _value=function(x,y) {
		if (!y) y=0;
		if ((x<0)||(x>=m_N1)) return 0;
		if ((y<0)||(y>=m_N2)) return 0;
		var ii=x+m_N1*y; 
		var ret=m_data[ii];
		if (isNaN(ret)) ret=0;
		return ret;
	};
	var _setValue=function(val,x,y) {
		if ((x<0)||(x>=m_N1)) return;
		if ((y<0)||(y>=m_N2)) return;
		var ii=x+m_N1*y; 
		m_data[ii]=val;
	};
	var _dataX=function(y) {
		var ret=new Float32Array(m_N1);
		for (var xx=0; xx<m_N1; xx++) {
			ret[xx]=m_data[xx+m_N1*y];
		}
		return ret;
	};
	var _dataY=function(x) {
		var ret=new Float32Array(m_N2);
		for (var yy=0; yy<m_N2; yy++) {
			ret[yy]=m_data[x+m_N1*yy];
		}
		return ret;
	};
	var _setDataX=function(data,y) {
		for (var xx=0; xx<m_N1; xx++) {
			m_data[xx+m_N1*y]=data[xx];
		}
	};
	var _setDataY=function(data,x) {
		for (var yy=0; yy<m_N2; yy++) {
			m_data[x+m_N1*yy]=data[yy];
		}
	};
	var _setData=function(data) {
		for (var ii=0,N=m_N1*m_N2; ii<N; ii++) {
			m_data[ii]=data[ii];
		}
	};
	var _min=function() {
		var ret=that.value(0,0);
		for (var ii=0,N=m_N1*m_N2; ii<N; ii++) {
			if (m_data[ii]<ret) ret=m_data[ii];
		}
		return ret;
	};
	var _max=function() {
		var ret=that.value(0,0);
		for (var ii=0,N=m_N1*m_N2; ii<N; ii++) {
			if (m_data[ii]>ret) ret=m_data[ii];
		}
		return ret;
	};
	var _scaleBy=function(val) {
		for (var ii=0,N=m_N1*m_N2; ii<N; ii++) {
			m_data[ii]=m_data[ii]*val;
		}
	};
			
	if (!N1) N1=1;
	if (!N2) N2=1;
	that.allocate(N1,N2);
}
