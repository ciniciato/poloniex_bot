var ex = polo;

function bot(args){
	this.id = '';
	this.counter = 0;
	this.exchange = null;
	this.orderbook = {asks: [], bids:[]};
	
	this.request_id  = 0;
	this.balance     = [0,0];//BRL, BTC
	this.last_update = 0;
	
	this.profit = 0;
	this.trades = 0;
	this.total  = 0;
	
	this.orders = [];
	this.history = [];
	this.requests = [];//func, args
	
	for (var property in args)
		if (args.hasOwnProperty(property) && this.hasOwnProperty(property))
			this[property] = args[property]; 
	
	this.init();
	
	return this;
}

bot.prototype.save = function(){
	localStorage.setItem(this.id+'_orders', JSON.stringify(this.orders));
}

bot.prototype.load = function(){
	var that = this;
	var new_orders = [];
	if (localStorage.getItem(this.id+'_orders') != null){
		var data = JSON.parse(localStorage.getItem(this.id+'_orders'));
		for (var i=0; i<data.length; i++){
			data[i].is_busy = false;
			
			if(data[i].id==0){
				new_orders.push(data[i]);
				continue;
			}
			
			if (data[i].group == 'buy')
				this.orders.push(new buy_order(data[i]));
			else
				this.orders.push(new sell_order(data[i]));
		}
	}
	
	this.update_orderbook();
	
	for (var i=0; i<new_orders.length; i++){		
		if (new_orders[i].group == 'buy')
			this.orders.push(new buy_order(new_orders[i]));
		else
			this.orders.push(new sell_order(new_orders[i]));
	}
}

bot.prototype.get_total = function(){
	this.total = 0;
	for (var i=0; i<this.orders.length; i++)
		if (this.orders[i].id != 0)
			this.total += Number(this.orders[i].total);
}

bot.prototype.garbage = function(){
	for(var i=0; i<this.orders.length; i++)
		if (this.orders[i].to_destroy){
			var ind = this.exchange.orders.data.findIndex(a=>a.id==this.orders[i].id);
			this.exchange.orders.data.splice(ind, 1);
			this.orders.splice(i,1);
			i--;
		}
}

bot.prototype.update_orderbook = function(){
	var ar = this.orders.filter(a=>a.group=='buy');	
	
	this.orderbook.bids = this.exchange.orderBook.data.bids.slice();
	for(var i=0;i<ar.length;i++){
		var ord = ar[i];
		var ind = this.orderbook.bids.findIndex(a=>a[0]==ord.price);		
		if (ind>=0)	this.orderbook.bids.splice(ind, 1);
	}
	
	var n_data = [];
	ar = this.exchange.orderBook.data.bids;
	var sum = 0;
	for(var i=0;i<ar.length && i<10;i++){
		var ord = ar[i];
		sum += (ord[1]*ord[0]);
		n_data.push({
			id: 'bid_'+i,
			percent: (100*(ord[0]/ar[0][0]-1)).toFixed(3)+'%',
			cumulative: (sum).toFixed(4),
			total: (ord[1]*ord[0]).toFixed(4),
			price: ord[0].toFixed(8),
			is_mine: ''
		});
	}
	
	for (var i=0; i<this.orders.length; i++){
		var ord = n_data.find(a=>a.price==this.orders[i].price);
		if (ord) ord.is_mine = 'is_mine';
	}
	
	print('tbl_bids', n_data, 'is_mine');
	
	var ar = this.orders.filter(a=>a.group=='sell');
	this.orderbook.asks = this.exchange.orderBook.data.asks.slice();
	
	for(var i=0;i<ar.length;i++){
		var ord = ar[i];
		var ind = this.orderbook.asks.findIndex(a=>a[0]==ord.price);
		if (ind>=0) this.orderbook.asks.splice(ind, 1);
	}	
	
	var n_data = [];
	ar = this.exchange.orderBook.data.asks;
	var sum = 0;
	for(var i=0;i<ar.length && i<10;i++){
		var ord = ar[i];
		sum += (ord[1]*ord[0]);
		n_data.push({
			id: 'ask_'+i,
			price: ord[0].toFixed(8),
			total: (ord[1]*ord[0]).toFixed(4),
			cumulative: (sum).toFixed(4),
			percent: (100*(ord[0]/ar[0][0]-1)).toFixed(3)+'%',
			is_mine: ''
		});
	}
	for (var i=0; i<this.orders.length; i++){
		var ord = n_data.find(a=>a.price==this.orders[i].price);
		if (ord) ord.is_mine = 'is_mine';
	}
	
	print('tbl_asks', n_data, 'is_mine');
}

bot.prototype.update_orders = function(){
	var that = this;
	
	for(var i=0; i<this.orders.length; i++)
	{
		(function(){
			var order = that.orders[i];
			//order.updated = false;
			var updated = that.exchange.orders.data.find(a=> a.id==that.orders[i].id);
			
			//that.exchange.orders.get(order);
			
			if (updated) order.update(updated);
			//if (that.counter%5==0)
				order.check_profit();
		})(); 
	}
}

bot.prototype.check_connection = function(){
	var now = new Date();
	if (this.last_update!=0 && Math.abs(now - this.last_update) > 120000){
		//console.log(timenow()+' - connection down!');
		//audio_down.play();
	}
}

bot.prototype.update_overview = function(){
	var that = this;
	if (this.counter%2==0)
		this.exchange.balance.update(
			function(success, data){
				if (success){
					document.getElementById('balance_cash').innerHTML = data.BRL;
					document.getElementById('balance_btc').innerHTML = data.BTC;
				}
			}
		);
	
	document.getElementById('overview_profit').innerHTML = this.profit.toFixed(8);
	document.getElementById('overview_trades').innerHTML = this.trades;
	document.getElementById('overview_last_update').innerHTML = this.last_update.toLocaleString();
	document.getElementById('future_cash').innerHTML = this.total.toFixed(8);
}

bot.prototype.format_data = function(){
	var orders = this.orders.filter(a => a.group=='buy');
	orders = orders.sort((a,b)=> a.min_profit>b.min_profit);
	var data = [];
	for(var i=0; i<orders.length; i++){
		var order = orders[i];
		data.push({
			id: 'buy_order_'+i,
			position: order.position.toFixed(3),
			total: order.total.toFixed(8),
			price: order.price.toFixed(8),
			cur_profit: (order.cur_profit*100).toFixed(2),
			min_profit: (order.min_profit*100).toFixed(2)
		});
	}
	
	print('tbl_buy', data);
	
	var orders = this.orders.filter(a => a.group=='sell');
	orders = orders.sort((a,b)=> a.min_profit>b.min_profit);
	var data = [];
	for(var i=0; i<orders.length; i++){
		var order = orders[i];
		data.push({
			id: 'sell_order_'+i,
			position: order.position.toFixed(3),
			total: order.total.toFixed(8),
			price: order.price.toFixed(8),
			cur_profit: (order.cur_profit*100).toFixed(2),
			min_profit: (order.min_profit*100).toFixed(2)
		});
	}
	
	print('tbl_sell', data);
	
	//HISTORY ORDERS
	var orders = this.history.filter(a => a.group=='buy');
	var data = [];
	for(var i=0; i<orders.length; i++){
		var order = orders[i];
		data.push({
			id: 'buy_order_h_'+i,
			date: order.date,
			price: order.price,
			total: order.total
		});
	}
	
	print('tbl_buy_history', data);
	
	var orders = this.history.filter(a => a.group=='sell');
	var data = [];
	for(var i=0; i<orders.length; i++){
		var order = orders[i];
		data.push({
			id: 'sell_order_h_'+i,
			date: order.date,
			price: order.price,
			total: order.total
		});
	}
	
	print('tbl_sell_history', data);
}

bot.prototype.get_trades = function(){
	if (this.counter%15==0)
		this.exchange.trades.update();
	
	var nowTime = + new Date();
	nowTime = Math.round(nowTime/1000);
	
	var data = this.exchange.trades.data;
	var n_data = [];
	
	for (var i=0; i<data.length && i<10; i++)
		n_data.push({		
			id: 'trade_'+i,
			group: data[i].type,
			time: formatSeconds(nowTime - data[i].date),
			price: data[i].price.toFixed(2),
			total: round(data[i].price*data[i].amount,2).toFixed(2)
		});
	print('tbl_trades', n_data, 'group');
}

bot.prototype.loop = function(){
	var that = this;
	
	this.get_total();
	
	this.update_overview();
	//this.check_connection();
	
	//UPDATE ORDER BOOK
	//if (this.counter%3==0)
	this.exchange.orderBook.update(
		function(success){
			if (success){ 
				that.last_update = new Date();
				that.update_orderbook();
			}
		});
		
	//UPDATE ORDERS
	//this.exchange.orders.update();
	//if (this.counter%2==0)
	this.exchange.orders.update_trades();
	
	//UPDATE ORDERS
	this.update_orders();
	
	//GARBAGE
	this.garbage();
	//PRINT
	this.format_data();
	this.get_trades();
	
	this.save();
	
	this.counter++;
	if (this.counter>=1000) this.counter = 0;
}

bot.prototype.init = function(){
	var that = this;
	
	this.exchange.orders.update(function(success){
		if (success){			
			log('ORDERS UPDATED!');
			that.exchange.orderBook.update(function(success){
				if (success){		
					that.load();			
					log('ORDERBOOK UPDATED!');
					
					setInterval(function(){ that.loop(); },1500);
				}
			}, true);
		}
	}, true);				
}

var main_bot = new bot({		
						exchange: polo,
						id: 'polo_testnet_'+coin
					});