var chartLoaded = false;
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback();

document.getElementById('submit_order').addEventListener('click',
	function(e){
		var total = document.getElementById('inp_total').value;
		var profit = document.getElementById('inp_profit').value;
		var type = document.getElementById('slt_type').value;
		
		if (total > 0 && profit >= 0 && type >= 0)
			main_bot.orders.push(
				new buy_order({ 
					total: Number(total), 
					min_profit: Number(profit)/100,
					type: Number(type)
				})
			);
	});
	
document.getElementById('cancel_all').addEventListener('click',
	function(e){
		var orders = main_bot.orders;
		for(var i=0; i<orders.length; i++){
			if (orders[i].id!=0)
				main_bot.exchange.orders.cancel(orders[i]);
		}
		main_bot.orders = [];
	});


function getStats(_data){
	var stats = {};
	
	var tData = _data.map(function(obj) {
	  return obj.rate;
	});
	stats.open  = _data[0].rate;
	stats.close = _data[_data.length-1].rate;
	stats.max = ss.max(tData);
	stats.min = ss.min(tData);
	stats.var = ss.variance(tData);
	stats.std = ss.standardDeviation(tData);
	stats.rate_mean = ss.mean(tData);
	stats.var_p = stats.max/stats.min-1;
	
	var tData = _data.map(function(obj) {
	  return obj.total;
	});
	
	stats.amount_mean = ss.mean(tData);
	stats.frequency = _data.length;
	
	return stats;
}

function plot_rateChart(_data){
	var minTime = _data[0].date;
	var maxTime = _data[_data.length-1].date;
	
	var chartData = [];
	for(var i = minTime; i<maxTime; i++){
		var tData = _data.filter(a => a.date==i);
		if (tData.length<=0) continue;
		var stat = getStats(tData);
		chartData.push([(i-maxTime-minTime), stat.min, stat.open, stat.close, stat.max]);
	}
    var data = google.visualization.arrayToDataTable(chartData, true);

	var options = {
		legend:'none',		
		//bar: { groupWidth: '100%' },
        colors: ['#D35400', '#D35400'],
		candlestick: {
			fallingColor: { strokeWidth: 0, fill: '#27AE60' }, // red
			risingColor: { strokeWidth: 0, fill: '#E74C3C' }   // green
		},
		backgroundColor: 'none',
		legendTextStyle: { color: '#FEFEFE' },
		titleTextStyle: { color: '#FEFEFE' },
		hAxis: {
			textStyle:{color: '#FEFEFE'}
		},
		vAxis: {
			textStyle:{color: '#FEFEFE'}
		},
		trendlines: {
			0: {
				type: 'polynomial',
				degree: 3,
				visibleInLegend: true,
				}
			}
	};

    var chart = new google.visualization.CandlestickChart(document.getElementById('rate_chart'));

    chart.draw(data, options);
}

function scatter_rateChart(_data){
	var minTime = _data[0].date;
	var maxTime = _data[_data.length-1].date;
	
	var tdata = _data.filter(a => a.type=='buy');
	
	var chartData = [];
	for(var i = 0; i<tdata.length; i++){
		chartData.push([(tdata[i].date-maxTime-minTime), tdata[i].rate]);
	}
    var data = google.visualization.arrayToDataTable(chartData, true);

	var options = {
		legend:'none',		
        colors: ['#0f9d58', '#0f9d58'],
		backgroundColor: 'none',
		hAxis: {
			baselineColor: 'none',
			ticks: []
		},
		vAxis: {
			baselineColor: 'none',
			ticks: []
		}
	};

    var chart = new google.visualization.ScatterChart(document.getElementById('buy_scatter_rate_chart'));

    chart.draw(data, options);
	
	
	var tdata = _data.filter(a => a.type=='sell');
	
	var chartData = [];
	for(var i = 0; i<tdata.length; i++){
		chartData.push([(tdata[i].date-maxTime-minTime), tdata[i].rate]);
	}
    var data = google.visualization.arrayToDataTable(chartData, true);
	options.colors = ['#a52714', '#a52714'];
	
    var chart = new google.visualization.ScatterChart(document.getElementById('sell_scatter_rate_chart'));

    chart.draw(data, options);
}

function plot_forceChart(_data){
	var minTime = _data[0].date;
	var maxTime = _data[_data.length-1].date;
	
	var chartData = [['time', 'buy', 'sale']];
	for(var i = minTime; i<maxTime; i++){
		var tData = _data.filter(a => a.date==i);
		if (tData.length<=0) continue;
		var sell = tData.filter(a => a.type=='sell');
		sell = sell.length;
		var buy = tData.filter(a => a.type=='buy');
		buy = buy.length;
		
		chartData.push([i-minTime-maxTime, buy, sell]);
	}	
	chartData = google.visualization.arrayToDataTable(chartData);

	var options ={
		curveType: 'function',
		legend: { position: 'right' },		
		backgroundColor: 'none',
		legendTextStyle: { color: '#FEFEFE' },
		titleTextStyle: { color: '#FEFEFE' },
		hAxis: {
			textStyle:{color: '#FEFEFE'}
		},
		vAxis: {
			textStyle:{color: '#FEFEFE'}
		},
		series: {
			0: { color: '#E74C3C' },
			1: { color: '#27AE60' }
		}
	};

	var chart = new google.visualization.LineChart(document.getElementById('force_chart'));

	chart.draw(chartData, options);
}

function plot_varChart(_data){
		return false;
	if (!chartLoaded){ 
	}
	
	var chartData = [['rate', 'amount']];
	var sum = 0;
	for(var i = 0; i<_data.bids.length; i++){
		sum += Number(_data.bids[i][1])*Number(_data.bids[i][0]);
		chartData.push([Number(_data.bids[i][0]), sum]);
	}		
	
	chartData = google.visualization.arrayToDataTable(chartData);

	var options ={
		curveType: 'function',
		legend: 'none',		
		backgroundColor: 'none',
		legendTextStyle: { color: '#FEFEFE' },
		titleTextStyle: { color: '#FEFEFE' },
		hAxis: {
			baselineColor: 'none',
			ticks: []
		},
		vAxis: {
			baselineColor: 'none',
			ticks: []
		}
	};

	var chart = new google.visualization.LineChart(document.getElementById('bid_chart'));

	chart.draw(chartData, options);
	
	var chartData = [['rate', 'amount']];	
	var sum = 0;
	for(var i = 0; i<_data.asks.length; i++){
		sum += Number(_data.asks[i][1])*Number(_data.asks[i][0]);
		chartData.push([Number(_data.asks[i][0]), sum]);
	}	
		
	chartData = google.visualization.arrayToDataTable(chartData);

	var chart = new google.visualization.LineChart(document.getElementById('ask_chart'));

	options.series = {
		0: { color: '#E74C3C' }
	};
	chart.draw(chartData, options);
	
}

function computeTrades(_data){
	chartLoaded = true;
	
	var DATA = _data.sort(
		function(a,b){
			return a.date-b.date;
		}
	);
	
	plot_rateChart(DATA);
	plot_forceChart(DATA);
	
	//STATS
	var _data = DATA.filter(a=> a.date==DATA[0].date && a.type=='buy');
	var dtotal = _data.map(function(obj) {
	  return obj.rate*obj.amount;
	});
	var mean = ss.mean(dtotal);
	var total = ss.sum(dtotal);
	var frequency = _data.length;
	print('tbl_buy_stat', 
		  [{id: 'buy_stat_0', frequency: frequency, mean: mean.toFixed(8), total: total.toFixed(8)}]
		  , 'is_mine');
	
	
	var _data = DATA.filter(a=> a.date==DATA[0].date && a.type=='sell');
	var dtotal = _data.map(function(obj) {
	  return obj.rate*obj.amount;
	});
	var mean = ss.mean(dtotal);
	var total = ss.sum(dtotal);
	var frequency = _data.length;
	print('tbl_sell_stat', 
		  [{id: 'sell_stat_0', frequency: frequency, mean: mean.toFixed(8), total: total.toFixed(8)}]
		  , 'is_mine');
	//scatter_rateChart(DATA);
	
	/*
	var buy_trades = data.filter(a=> a.type=='buy');
	var _data = buy_trades.map(function(obj) {
	  return obj.total;
	});
	console.log(_data);
	console.log(ss.mean(_data));
	var trades_per_minute = buy_trades.length/15;
	console.log(trades_per_minute);
	
	var sell_trades = data.filter(a=> a.type=='sell');
	var _data = sell_trades.map(function(obj) {
	  return obj.total;
	});
	console.log(ss.mean(_data));
	*/
}