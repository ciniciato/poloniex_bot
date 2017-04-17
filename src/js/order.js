const 
	FIXED=0,
	CUMULATIVE=1,
	FUTURE_FIXED=2,
	FUTURE_CUMULATIVE=3,
	ARBITRAGE=4;


function order(args){	
	this.type = -1;
	this.group = 0;
	
	this.status = 0;
	this.action = 'STAND BY';
	
	this.date = 0;
	this.id = 0;
	this.position = 0;
	
	this.amount = 0;
	this.price = 0;
	this.total = 0;
	this.fixed_total = 0;
	
	this.min_profit = 0;
	this.cur_profit = 0;
	
	this.is_busy = false;
	this.to_destroy = false;
	this.is_updated = false;	
	
	for (var property in args)
		if (args.hasOwnProperty(property) && this.hasOwnProperty(property))
			this[property] = args[property];
	
	if (this.fixed_total==0)
		this.fixed_total = this.total;	
		
	if (this.date==0) this.date = new Date().toLocaleString();
	
	if (this.id==0 && this.type>-1)
		this.commit();
}

order.prototype.get_best_price = function(){
}

order.prototype.update = function(ord){
	this.action = 'UPDATING';
	this.updated = true;
	this.status = ord.status;
	
	var amount = round(round(this.amount,8) - round(ord.amount,8), 8);
	if (amount>0.0000000) this.on_execute(amount);
	
	this.total = (this.amount*this.price);
		
	if (this.status=='EXECUTED' || this.status=='CANCELED')
		this.to_destroy = true;	
}

order.prototype.commit = function(){
	this.action = 'COMMITING';
}

order.prototype.check_profit = function(ord){
	this.action = 'CHECKING';
}

order.prototype.on_execute = function(amount){
	main_bot.trades++;
	//audio_cash.play();
		
	log(this.group+' '+amount+' executed!');
	console.log(this);
	
	main_bot.history.unshift({
		date: new Date().toLocaleString(),
		group: this.group,
		price: this.price.toFixed(8),
		total: (this.price*amount).toFixed(8)
	});
	
	this.amount = Number(this.amount) - Number(amount); 
	
	amount = Number(amount);	
	var fee = main_bot.exchange.fees.p_order[0];
	if (this.group=='buy'){
		if (this.type==FUTURE_FIXED || this.type==FUTURE_CUMULATIVE)
			fee = main_bot.exchange.fees.a_order[0]; 
	}
	fee += 0.0002;
	
	
	amount = round(amount*(1 - fee),8);
	
	return amount;
}

function buy_order(args){	
	args.group = 'buy';
	
	order.call(this, args);
	
	return this;
}

buy_order.prototype = new order();

buy_order.prototype.commit = function(){	
	order.prototype.commit.call(this);
	
	var that = this;
	
	//MERGE
	var _order = main_bot.orders.find(a => a.id!=this.id && 
										a.type==this.type && 
										a.min_profit==this.min_profit &&
										a.is_busy==false &&
										a.to_destroy==false &&
										a.group==this.group
										);
	if (_order !== undefined){ 
		_order.is_busy = true;
		this.is_busy = true;

		main_bot.exchange.orders.cancel(_order,
			function(success){
				if (success){
					//_order.update(order);
					
					main_bot.orders.push(
						new buy_order({ 
							total: round(Number(_order.total)+Number(that.total), 8), 
							min_profit: Number(that.min_profit),
							type: Number(that.type)
						})
					);
					_order.to_destroy = true;
					that.to_destroy = true;
				}else{
					that.to_destroy = true;
					console.log('SE FUDEU');
					//setTimeout(function(){that.commit();},500);
				}
				_order.is_busy = false;
				that.is_busy = false;
			}
		);
		
		return false;
	}
	
	
	this.is_busy = true;
	this.price = this.get_best_price();
	
	this.amount = round(this.total/this.price, 8);
	main_bot.exchange.buy.now(this.amount, 
				this.price,
				function(success, data){
					if (success){
						that.id = data.id;
					}else{
						that.to_destroy = true;
					}
					that.is_busy = false;
				});
}

buy_order.prototype.get_best_price = function(){
	
	var first_ask = Number(main_bot.orderbook.asks[0][0]);
	var price = this.price;
	
	if (this.type==FIXED || this.type==CUMULATIVE){
		var min_price = first_ask * (1 - ex.fees.p_order[0]*2 - this.min_profit);
		
		var ar = main_bot.orderbook.bids.filter(a=> a[0] < min_price);
		if (ar.length>0) price = Number(ar[0][0])+.00000001;
		
		if (price >= first_ask)
			price -= .00000001;
		
	}else if(this.type==FUTURE_FIXED || this.type==FUTURE_CUMULATIVE || this.type==ARBITRAGE){
		price = Number(first_ask);//Number(main_bot.orderbook.bids[0][0])+.00000001;
	}
	
	
	price = round(price,8);
	
	return price;
}

buy_order.prototype.on_execute = function(amount){	
	amount = order.prototype.on_execute.call(this, amount);

	if (this.type!=ARBITRAGE)		
		main_bot.orders.push(
			new sell_order({
				b_price: this.price,
				amount: round(amount,8),
				min_profit: this.min_profit,
				type: this.type
			})
		);	
}

buy_order.prototype.update = function(ord){
	var that = this;
	
	order.prototype.update.call(this, ord);
	
	//UPDATE POSITION
	this.position=0;
	
	var ar = ex.orderBook.data.bids.filter(a => Number(a[0]) > this.price);
	for(var i=0; i<ar.length; i++)
		this.position += Number(ar[i][1])*Number(ar[i][0]);
	
	//UPDATE CURRENT PROFIT
	var first_ask = Number(main_bot.orderbook.asks[0][0]);
	this.cur_profit = first_ask/this.price - 1 - main_bot.exchange.fees.p_order[0]*2;
}

buy_order.prototype.check_profit = function(ord){
	if (this.is_busy || this.to_destroy || this.id==0) return false;
	order.prototype.check_profit.call(this, ord);
	
	var that = this;
	
	var n_price = this.get_best_price();
	if (this.price.toFixed(8) != n_price.toFixed(8)){
		
		this.is_busy = true;
		main_bot.exchange.orders.cancel(that,
			function(success){
				if (success){
					that.to_destroy = true;
					main_bot.orders.push(
						new buy_order({ 
							total: round(that.total, 8), 
							min_profit: that.min_profit,
							type: Number(that.type)
						})
					);
				}
				that.is_busy = false;
			}
		);
	}
}

function sell_order(args){
	this.b_price = 0;
	
	args.group = 'sell';
	
	order.call(this, args);
	
	return this;
}

sell_order.prototype = new order();

sell_order.prototype.get_best_price = function(){
	var first_bid = Number(main_bot.orderbook.bids[0][0]);
	
	if (this.type==FUTURE_FIXED || this.type==FUTURE_CUMULATIVE)
		var min_profit = this.min_profit;
	else if(this.type==FIXED || this.type==CUMULATIVE)
		var min_profit = this.min_profit/2;
	
	var min_price = this.b_price * (1 + ex.fees.p_order[0]*2 + min_profit);
	var price = min_price;
	
	var ar = main_bot.orderbook.asks.filter(a=> a[0] > min_price);
	if (ar.length>0) price = Number(ar[0][0])-.00000001;
	
	price = round(price,8);
	
	if (price <= first_bid)
		price += .00000001;
	
	return price;
}

sell_order.prototype.update = function(ord){
	order.prototype.update.call(this, ord);
	
	this.total = round(this.total*(1 - main_bot.exchange.fees.p_order[0]), 8);
	
	//UPDATE POSITION
	this.position=0;
	
	var ar = ex.orderBook.data.asks.filter(a => Number(a[0]) < this.price);
	for(var i=0; i<ar.length; i++)
		this.position += Number(ar[i][1])*Number(ar[i][0]);
	
	//UPDATE CURRENT PROFIT
	if (this.b_price>0)
		this.cur_profit = this.price/this.b_price - 1 - main_bot.exchange.fees.p_order[0]*2;
}

sell_order.prototype.on_execute = function(amount){
	amount = order.prototype.on_execute.call(this, amount);

	var total = amount * this.price;
		
	var profit = total*this.cur_profit;
	main_bot.profit += profit;
	
	if (this.type == FIXED || this.type == FUTURE_FIXED)
		total -= profit;
	
	if (this.type != FUTURE_FIXED)
	main_bot.orders.push(
		new buy_order({
			total: round(total, 8),
			min_profit: this.min_profit,
			type: this.type
		})
	);
}

sell_order.prototype.commit = function(){	
	order.prototype.commit.call(this);
	var that = this;
	
	//MERGE
	var _order = main_bot.orders.find(a => a.id!=this.id && 
										a.type==this.type && 
										a.min_profit==this.min_profit &&
										a.is_busy==false &&
										a.to_destroy==false &&
										a.group==this.group
										);
	if (_order !== undefined){ 
		_order.is_busy = true;
		this.is_busy = true;

		main_bot.exchange.orders.cancel(_order,
			function(success, order){
				if (success){
					//_order.update(order);
					
					_order.amount = Number(_order.amount);
					that.amount = Number(that.amount);
					
					
					//calculate average price
					var b_price = (_order.b_price*_order.amount + that.b_price*that.amount)/(that.amount+_order.amount);
					b_price = round(that.b_price, 8);
					
					main_bot.orders.push(
						new sell_order({ 
							amount: round(_order.amount+that.amount, 8),
							b_price: b_price,
							min_profit: that.min_profit,
							type: that.type
						})
					);
					_order.to_destroy = true;
					that.to_destroy = true;
				}else{
					that.to_destroy = true;
					console.log('SE FUDEU');
				}
				
				_order.is_busy = false;
				that.is_busy = false;
			}
		);
		
		return false;
	}
	
	this.is_busy = true;
	this.price = this.get_best_price();
	this.total = round(this.amount*this.price, 8);
	main_bot.exchange.sell.now(this.amount, 
				this.price,
				function(success, data){
					if (success){
						that.id = data.id;
					}else{
						that.to_destroy = true;
					}
					that.is_busy = false;
				});
}

sell_order.prototype.check_profit = function(ord){
	if (this.is_busy || this.to_destroy || this.id==0 || (this.type==FUTURE_FIXED || this.type==FUTURE_CUMULATIVE) ) return false;
	order.prototype.check_profit.call(this, ord);
	
	var that = this;
	
	var n_price = this.get_best_price();
	if (this.price.toFixed(8) != n_price.toFixed(8)){	
		this.is_busy = true;
		main_bot.exchange.orders.cancel(that,
			function(success, order){
				if (success){
					//that.update(order);
					that.to_destroy = true;
					main_bot.orders.push(
						new sell_order({ 
							amount: that.amount,
							b_price: that.b_price,
							min_profit: that.min_profit,
							type: that.type
						})
					);
				}
				that.is_busy = false;
			}
		);
	}
}