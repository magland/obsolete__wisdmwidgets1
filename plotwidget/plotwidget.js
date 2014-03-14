require('pages:/3rdparty/flot/jquery.flot.js');

function PlotWidget() {
	var that=this;
	
	this.div=function() {return m_div;};
	this.setSize=function(W,H) {m_width=W; m_height=H; refresh_layout(); schedule_refresh();};
	this.refresh=function(callback) {return _refresh.apply(this,arguments);};
	this.addSeries=function(S) {return _addSeries.apply(this,arguments);};
	this.clearSeries=function() {m_series_list=[]; m_markings=[];};
	this.setTitle=function(title) {m_title=title;};
	this.setShowYAxis=function(val) {that.setYAxisLabelsVisible(val);};
	this.onPlotClicked=function(handler) {m_plot_clicked_handlers.push(handler);};
	this.setXRange=function(xmin,xmax) {m_xmin=xmin; m_xmax=xmax;};
	this.setYRange=function(ymin,ymax) {m_ymin=ymin; m_ymax=ymax;};
	this.setXAxisLabelsVisible=function(val) {m_x_axis_labels_visible=val;};
	this.setYAxisLabelsVisible=function(val) {m_y_axis_labels_visible=val;};
	this.addMarkings=function(markings) {for (var i=0; i<markings.length; i++) m_markings.push(markings[i]);};
		
	var m_width=0;
	var m_height=0;
	var m_series_list=[];
	var m_markings=[];
	var m_title='';
	var m_div=$('<div></div>');
	var m_plot_div=null;
	var m_show_y_axis=true;
	var m_plot_clicked_handlers=[];
	var m_xmin=null,m_xmax=null;
	var m_ymin=null,m_ymax=null;
	var m_x_axis_labels_visible=true;
	var m_y_axis_labels_visible=true;
	m_div.css('position','absolute');
	
	var _addSeries=function(S) {
		var S0=$.extend({},{
			xdata:[],
			ydata:[],
			ids:[],
			color:get_default_color(m_series_list.length),
			clickable:false
		},S);
		m_series_list.push(S0);
	};
	
	function get_default_color(index) {
		var list=['black','blue','red','green','orange','magenta','pink','cyan','violet'];
		return list[index]||'';
	}
	
	var refresh_layout=function() {
		m_div.css('width',m_width);
		m_div.css('height',m_height);
		
		var left_margin=4;
		var right_margin=4;
		var top_margin=4;
		var bottom_margin=4;
		
		var title_height=0;
		if (m_title.length>0) {
			var title_div=$('<div style="position:absolute;left:0px;right:0px;top:0px;font-family:Arial;font-size:12px"></div>');
			title_div.css('height',title_height);
			title_div.html('<center>'+m_title+'</center>');
			m_div.append(title_div);
			title_height=15;
		}
		
		var W0=m_width-left_margin-right_margin;
		var H0=m_height-title_height-top_margin-bottom_margin;
	
		if (m_plot_div) {
			m_plot_div.css('position','absolute');
			m_plot_div.css('width',W0);
			m_plot_div.css('height',H0);
			m_plot_div.css('top',title_height+top_margin);
			m_plot_div.css('left',left_margin);
		}
	};
	
	var make_symbol=function(symbol) {
		if (typeof(symbol)!='string') return symbol;
		if (symbol=='circle') return 'circle';
		else if (symbol=='cross') {
			return function(ctx, x, y, radius, shadow) {
					var size = radius * Math.sqrt(Math.PI) / 2;
					ctx.moveTo(x - size, y - size);
					ctx.lineTo(x + size, y + size);
					ctx.moveTo(x - size, y + size);
					ctx.lineTo(x + size, y - size);
			};
		}
		else if (symbol=='square') {
			return function (ctx, x, y, radius, shadow) {
					// pi * r^2 = (2s)^2  =>  s = r * sqrt(pi)/2
					var size = radius * Math.sqrt(Math.PI) / 2;
					ctx.rect(x - size, y - size, size + size, size + size);
			};
		}
		else if (symbol=='diamond') {
			return function (ctx, x, y, radius, shadow) {
					// pi * r^2 = 2s^2  =>  s = r * sqrt(pi/2)
					var size = radius * Math.sqrt(Math.PI / 2);
					ctx.moveTo(x - size, y);
					ctx.lineTo(x, y - size);
					ctx.lineTo(x + size, y);
					ctx.lineTo(x, y + size);
					ctx.lineTo(x - size, y);
			};
		}
		else if (symbol=='triangle') {
			return function (ctx, x, y, radius, shadow) {
					// pi * r^2 = 1/2 * s^2 * sin (pi / 3)  =>  s = r * sqrt(2 * pi / sin(pi / 3))
					var size = radius * Math.sqrt(2 * Math.PI / Math.sin(Math.PI / 3));
					var height = size * Math.sin(Math.PI / 3);
					ctx.moveTo(x - size/2, y + height/2);
					ctx.lineTo(x + size/2, y + height/2);
					if (!shadow) {
							ctx.lineTo(x, y - height/2);
							ctx.lineTo(x - size/2, y + height/2);
					}
			};
		}
		else return 'circle';
	};
	
	var m_refresh_scheduled=false;
	function schedule_refresh() {
		if (m_refresh_scheduled) return;
		m_refresh_scheduled=true;
		setTimeout(function() {
			m_refresh_scheduled=false;
			_refresh();
		},100);
	}
	var m_global_refresh_code='';
	var _refresh=function(callback) {
		var local_refresh_code=makeRandomId();
		m_global_refresh_code=local_refresh_code;
		var DDD=[];
		
		var timer0=new Date();
		
		for (var ii=0; ii<m_series_list.length; ii++) {
			var S0=m_series_list[ii];
			if (S0.points) {
				S0.points.symbol=make_symbol(S0.points.symbol);
			}
			var D0={color:S0.color,clickable:S0.clickable};
			D0.data=new Array(S0.xdata.length);
			for (var jj=0; jj<S0.xdata.length; jj++) {
				D0.data[jj]=[S0.xdata[jj],S0.ydata[jj]];
			}
			if ('lines' in S0) D0.lines=S0.lines;
			if ('points' in S0) D0.points=S0.points;
			if ('bars' in S0) D0.bars=S0.bars;
			if ('label' in S0) D0.label=S0.label;
			
			DDD.push(D0);
		}
		
		(function() {
			var old_plot=m_plot_div;
			m_plot_div=$('<div id=the_plot></div>');
			
			m_plot_div.bind("plotclick", function (event, pos, item) {
				if (item) {
					if ((0<=item.seriesIndex)&&(item.seriesIndex<m_series_list.length)) {
						var S1=m_series_list[item.seriesIndex];
						if (S1.onPointClicked) {
							var id0=S1.ids[item.dataIndex]||'';
							if (id0!=='') S1.onPointClicked(id0);
						}
					}
				}
				for (var jj=0; jj<m_plot_clicked_handlers.length; jj++) {
					m_plot_clicked_handlers[jj]([pos.x,pos.y],pos.event||{}); //requires modified version of flot (jfm)
				}
				
			});
			
			setTimeout(function() {
				if (m_global_refresh_code!=local_refresh_code) return;
				
				if (old_plot) {
					old_plot.hide();
					old_plot.remove();
				}
				
				refresh_layout();
				var xaxis0={show:m_x_axis_labels_visible};
				if ((m_xmin!==null)&&(m_xmax!==null)) {
					xaxis0.min=m_xmin;
					xaxis0.max=m_xmax;
				}
				var yaxis0={show:m_x_axis_labels_visible};
				if ((m_ymin!==null)&&(m_ymax!==null)) {
					yaxis0.min=m_ymin;
					yaxis0.max=m_ymax;
				}
				m_div.empty();
				m_div.append(m_plot_div);

				$.plot(m_plot_div,DDD,{
					xaxis:xaxis0,
					yaxis:yaxis0,
					grid:{clickable:true,markings:m_markings,borderWidth:2}
					//yaxis:{min:-1.1,max:1.1},
					//xaxis:{labelHeight:xaxis_label_height}
				});
				
				setTimeout(function() {
					if (callback) callback();
				},10);
			},10);
		})();
		/*
		setTimeout(function() {
			$.plot(m_plot_div,[{data:[[1,1],[2,2]]}]);
		},100);
		*/
	};
}
