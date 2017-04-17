var polo = new exchange({
	id: 'polo',
	fees:{//percent | abs
		in_BRL :[0, 0],
		out_BRL:[0, 0],
		in_BTC :[0,0],
		out_BTC:[0,0],
		p_order:[0.0015, 0],
		a_order:[0.0025, 0]
	}
});

polo.balance.update = function(doafter){
	doafter = doafter || function(){};
	if (this.isBusy) return false;
	this.isBusy = true;
	
	var req = new XMLHttpRequest();
	var data = new FormData();
	data.append('action', 'get_balance');
	data.append('coin', coin);

	var that = this;

	req.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			var result = {};
			try{
				result = JSON.parse(this.responseText);
			}catch(e){
				result.success = '0';
			}			
			
			if (result.BTC){
				that.data.BRL = Number(result.BTC).toFixed(8);
				that.data.BTC = Number(result[coin]).toFixed(8);
			}
			
			doafter(result.BTC, that.data);
			that.isBusy = false;
		}
	}

	req.open('POST', 'php/polo.php', true);			
	req.send(data);
	
	return true;
}

polo.orders.update  = function(doafter, force, error){
	doafter = doafter || function(){};
	if (this.isBusy && !error) return false;
	this.isBusy = true;
	
	var req = new XMLHttpRequest();
	var data = new FormData();
	data.append('action', "get_orders");
	data.append('coin', coin);

	var that = this;

	req.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			var result = {};
			var success = false;
			try{
				result.oReturn = JSON.parse(this.responseText);
				success = (result.oReturn);
			}catch(e){
			}
			
			//console.log(this.responseText);
			
			
			if (success){				
				var data = that.data;				
				//for(var i=0; i<data.length; i++)
				//	data[i].updated = false;
				
				var data = result.oReturn;
				
				for(var i=0; i<data.length; i++){
					var order = data[i];
					order = {date: order.date, id: order.orderNumber, status: 'OPEN', price: Number(order.rate), amount: Number(order.amount), group: order.type, updated: true};

					var ind = that.data.findIndex(a=>a.id==order.id);
					if (ind>=0)
						that.data[ind] = copyObject(order, that.data[ind]);
					else
						that.data.push(order);
				}
				//console.log(that.data);
			}
			//else if (force)				
			//	setTimeout(function(){ that.update(doafter, force, true); },1000);
			
			var success = true;
			doafter(success, that.data);
			
			if (success || !force)
				that.isBusy = false;
		}
	}

	req.open('POST', 'php/polo.php', true);			
	req.send(data);
	
	return true;
}


polo.orders.get  = function(order, doafter){
	doafter = doafter || function(){};
	
	var req = new XMLHttpRequest();
	var data = new FormData();
	data.append('action', "get_order");
	data.append('coin', coin);
	data.append('id', order.id);

	var that = this;

	req.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			var result = {};
			var success = false;
			try{
				result.oReturn = JSON.parse(this.responseText);
				success = (result.oReturn);
			}catch(e){
			}			
			
			if (success){								
				var data = result.oReturn;
				for(var i=0; i<data.length; i++){
					var trade = data[i];
					trade = {date: trade.date, id: order.id, tid: trade.tradeID, amount: Number(trade.amount), group: trade.type, updated: true};

					var ind = that.trades.findIndex(a=>a.tid==trade.tid && a.id==trade.id);
					if (ind<0){
						that.trades.push(trade);
						r_order = that.data.find(a=>a.id==trade.id);
						if (r_order) {
							r_order.amount -= trade.amount;
							if (round(r_order.amount,8)<=0) r_order.status = 'EXECUTED';
						}
					}
				}
			}
			
			var success = true;
			doafter(success, that.data);
		}
	}

	req.open('POST', 'php/polo.php', true);			
	req.send(data);
	
	return true;
}

polo.orders.update_trades  = function(doafter){
	doafter = doafter || function(){};
	
	var req = new XMLHttpRequest();
	var data = new FormData();
	data.append('action', "get_my_trade_history");
	data.append('coin', coin);

	var that = this;

	req.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			var result = {};
			var success = false;
			try{
				result.oReturn = JSON.parse(this.responseText);
				success = (result.oReturn);
			}catch(e){
			}
			
			if (success){								
				var data = result.oReturn;
				
				for(var i=0; i<data.length; i++){
					var trade = data[i];
					trade = {date: trade.date, id: trade.orderNumber, tid: trade.tradeID, amount: Number(trade.amount), group: trade.type, updated: false};

					var r_order = that.data.find(a=>a.id==trade.id);
					if (r_order) {
						var ind = that.trades.findIndex(a=>a.tid==trade.tid && a.id==trade.id);
						if (ind<0){
							that.trades.push(trade);						
							r_order.amount -= trade.amount;
							if (round(r_order.amount,8)<=0) r_order.status = 'EXECUTED';
						}
					}
				}
			}
			
			var success = true;
			doafter(success, that.data);
		}
	}

	req.open('POST', 'php/polo.php', true);			
	req.send(data);
	
	return true;
}

polo.orderBook.update = function(doafter, force, error){
	doafter = doafter || function(){};
	if (this.isBusy && !error) return false;
	this.isBusy = true;
	
	var req = new XMLHttpRequest();
	var data = new FormData();
	data.append('action', 'get_orderbook');
	data.append('coin', coin);

	var that = this;

	req.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			var result;
			try{
				result = JSON.parse(this.responseText);
			}catch(e){
				result = false;
			}
			
			var success = (result.asks != undefined);
			
			if (success && result.bids!=undefined && result.bids.length!=undefined){
				var data = result.bids;
				var n_data = [];
				for (var i=0; i<data.length; i++){
					n_data.push([Number(data[i][0]),  Number(data[i][1])]);
				}
				that.data.bids =  n_data;
				
				var data = result.asks;
				var n_data = [];
				for (var i=0; i<data.length; i++){
					n_data.push([Number(data[i][0]),  Number(data[i][1])]);
				}
				that.data.asks = n_data;
				
				//plot_varChart(that.data);
		}else if (force)
				setTimeout(function(){ that.update(doafter, force, true);}, 0); 
			
			doafter(success, that.data);
			
			if (success || !force)
				that.isBusy = false;
		}
	}

	req.open('POST', 'php/polo.php', true);			
	req.send(data);
	
	return true;
}

polo.trades.update = function(){
	if (this.isBusy) return false;
	this.isBusy = true;
	
	var time = new Date();
	time.setMinutes(time.getMinutes() - 120);
	time = Math.floor(time/1000);
	time = time.toString();

	var req = new XMLHttpRequest();
	var data = new FormData();
	data.append('action', 'get_trades');
	data.append('start', time);
	data.append('coin', coin);	
	
	var that = this;

	req.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			var result = {};
			try{
				result = JSON.parse(this.responseText);
			}catch(e){
				result = false;
			}			
			
			if (result){				
				var nowTime = + new Date();
				nowTime = Math.round(nowTime/1000);
				
				result.sort((a,b)=> a.date<b.date);
				
				document.title = coin +' - '+ result[0].rate; 
				
				for(var i=0; i<result.length; i++){
				 	var cdate = + new Date(result[i].date);
					cdate = Math.round(cdate/1000);
					result[i].date = Math.round(Math.abs(nowTime - cdate)/(60*5));
					result[i].amount = Number(result[i].amount);
					result[i].rate = Number(result[i].rate);
					result[i].total = Number(result[i].total);
					
				}
				
				computeTrades(result);
				
				that.isBusy = false;
			}
		}
	}

	req.open('POST', 'php/polo.php', true);			
	req.send(data);
	
	return true;
}

polo.orders.cancel = function(_order, doafter){
	doafter = doafter || function(){};
	var req = new XMLHttpRequest();
	var data = new FormData();
	data.append('action', 'cancel');
	data.append('id',  _order.id);
	data.append('coin', coin);

	var that = this;

	req.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			var result = {};
			try{
				result = JSON.parse(this.responseText);
			}catch(e){
				result.success = '0';
			}
			if (result.success=='1'){							
				doafter(true);
			}
			else if (result.error!=undefined && (result.error.search('Nonce')>-1 || result.error.search('calls')>-1 ||
													result.error.search('Please try again')>-1 )){
				setTimeout(function(){ that.cancel(_order, doafter);}, 500); 
			}else{			
				log('error cancel:'+this.responseText);
				doafter(false);
			}
		}
	}

	req.open('POST', 'php/polo.php', true);			
	req.send(data);
}

polo.buy.now = function(amount, price, doafter){	
	doafter = doafter || function(){};
	var req = new XMLHttpRequest();
	var data = new FormData();
	data.append('action', 'buy');
	data.append('price',  price);
	data.append('amount', amount);
	data.append('coin', coin);
	
	var that = this;

	req.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			var result = {};
			try{
				result = JSON.parse(this.responseText);
				success = (result.orderNumber!=undefined)
			}catch(e){
				success = false;
			}
			var that_resp = this;
			var order = null;	
			
			
			if (success){
				var order = result;				
				order = {id: order.orderNumber, status: 'OPEN', price: Number(price), amount: Number(amount), group: 'buy'};
				that.owner.orders.data.push(order);
				
				doafter(true,order);
			}
			else if (result.error!=undefined && (result.error.search('Nonce')>-1 || result.error.search('calls')>-1 ||
													result.error.search('Please try again')>-1 )){
				log('error sell:'+this.responseText);
				setTimeout(function(){ that.now(amount, price, doafter);}, 500); 
			}
			else{			
				log('error buy:'+this.responseText);
				doafter(false);
			}
		}
	}

	req.open('POST', 'php/polo.php', true);			
	req.send(data);
}


polo.sell.now = function(amount, price, doafter){	
	doafter = doafter || function(){};
	var req = new XMLHttpRequest();
	var data = new FormData();
	data.append('action', 'sell');
	data.append('price',  price);
	data.append('amount', amount);
	data.append('coin', coin);
	var that = this;

	req.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			var result = {};
			try{
				result = JSON.parse(this.responseText);
				success = (result.orderNumber!=undefined)
			}catch(e){
				success = false;
			}
			var that_resp = this;
			var order = null;
			
			if (success){
				var order = result;				
				order = {id: order.orderNumber, status: 'OPEN', price: Number(price), amount: Number(amount), group: 'sell'};
				that.owner.orders.data.push(order);
				
				doafter(true, order);
			}
			else if (result.error!=undefined && (result.error.search('Nonce')>-1 || result.error.search('calls')>-1 ||
													result.error.search('Please try again')>-1 )){
				log('error sell:'+this.responseText);
				setTimeout(function(){ that.now(amount, price, doafter);}, 500); 
				
			}
			else{
				log('error sell:'+this.responseText);
				doafter(false);
			}
		}
	}

	req.open('POST', 'php/polo.php', true);			
	req.send(data);
}