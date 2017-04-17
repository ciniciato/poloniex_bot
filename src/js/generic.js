var exchanges = {
	list:[],
	current: null
};

function exchange(args){
	this.id = '';
	var parent = this;
	
	this.fees = {};
	
	this.balance = {
		owner: parent,
		data: {BRL: 0, BTC: 0},
		isBusy: false,
		update:function(){},
		putData:function(){
		}
	};
	
	this.orderBook = {
		owner: parent,
		data: [],
		isBusy: false,
		update: function(){},
		putData: function(){
		}
	};
	
	this.orders = {
		owner: parent,
		data: [],
		trades: [],
		isBusy: false,
		db: function(){
			var req = new XMLHttpRequest();
			var data = new FormData();
			data.append('exchange', parent.id);

			var that = this;

			req.onreadystatechange = function(){
				if(this.readyState == 4 && this.status == 200){
					var result = {};
					try{
						result = JSON.parse(this.responseText);
						for(var i=0; i<result.length; i++)
							that.get(result[i].id);
					}catch(e){
						result = false;
					}
					if (!result)
						that.db();
				}
			}

			req.open('POST', 'php/order_select.php', true);			
			req.send(data);			
		},
		cancel:function(){},
		delete:function(id){
			var ind = this.data.findIndex(a=>a.id==id);
			this.data.splice(ind, 1);
			
			var req = new XMLHttpRequest();
			var data = new FormData();
			data.append('exchange', parent.id);
			data.append('id', id);

			var that = this;

			req.onreadystatechange = function(){
				if(this.readyState == 4 && this.status == 200){
					console.log(this.responseText);
					var result = {};
					try{
						result = JSON.parse(this.responseText);
					}catch(e){
						result.success = '0';
					}
					if (result.success=='1')
						that.putData();
					else
						that.delete(id);
				}
			}

			req.open('POST', 'php/order_delete.php', true);			
			req.send(data);	
		},
		get:function(){},
		update: function(){},
		putData: function(){
		}
	};
	
	this.trades = {
		owner: parent,
		data: [],
		isBusy: false,
		last_update: 0,
		update: function(){},
		putData: function(){		
		}
	};
	
	this.buy = {
		owner: parent,
		now: function(){},
		save: function(id){
			var req = new XMLHttpRequest();
			var data = new FormData();
			data.append('exchange', parent.id);
			data.append('id', id);

			var that = this;

			req.onreadystatechange = function(){
				if(this.readyState == 4 && this.status == 200){
					var result = {};
					try{
						result = JSON.parse(this.responseText);
					}catch(e){
						result.success = '0';
					}
					if (result.success=='1')
						console.log('Order saved!');
					else
						that.save(id);
				}
			}

			req.open('POST', 'php/order_insert.php', true);			
			req.send(data);			
		}
	};
	
	this.sell = {
		owner: parent,
		now: function(){}
	};
	
	this.el = null;
	
	for (var property in args) {
		if (args.hasOwnProperty(property)){
			this[property] = args[property]; 
		}
	}
	
	exchanges.list.push(this);
	exchanges.current = this;
}

exchange.prototype.createEl = function(){
	
	var req = new XMLHttpRequest();
	var data = new FormData();
	data.append('file', '../tmp_exchange.html');

	var that = this;

	req.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			var el = document.createElement('LI');
			el.id = 'exchange_'+that.id;
			
			el.innerHTML = this.responseText;
			
			document.getElementById('exchanges').appendChild(el);
			el.getElementsByClassName('title')[0].innerText = that.id;
			
			el.addEventListener('click',
				function(e){
					var els = el.parentNode.getElementsByClassName('selected');
					for (var i=0; i<els.length; i++) els[i].className = '';
					el.className = 'selected';
					that.orders.putData();
					exchanges.current = that;
					
				});
			
			that.el = el;
			
			that.balance.update();
			that.trades.update();
			that.orders.update();
			that.orderBook.update();
		}
	}

	req.open('POST', 'php/requestFile.php', true);			
	req.send(data);
}
