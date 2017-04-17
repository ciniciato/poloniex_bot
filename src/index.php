<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, minimal-ui" />
        <title>bot</title>
		<link rel="stylesheet" href="mdl/material.min.css">
		<script src="mdl/material.min.js"></script>
		
		<link rel="stylesheet" href="mdl/mdl-selectfield.css">		
		<script src="mdl/mdl-selectfield.js"></script>
		
		<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
		<link rel="stylesheet" href="css/style.css">
		
		<script src="js/simple-statistics.js"></script>
	</head>
	
    <body>				
		<div id="main">
			Total
			<input id="inp_total" type="number" />
			Profit
			<input id="inp_profit" type="number" />
			Type
			<select id="slt_type">		
				<option value="0">FIXED</option>
				<option value="1">CUMULATIVE</option>
				<option value="2">FUTURE FIXED</option>
				<option value="3">FUTURE CUMULATIVE</option>
				<option value="4">ARBITRAGE</option>
			</select>
			<button id="submit_order">SUBMIT ORDER</button>
			<button id="cancel_all">CANCEL ALL</button>
			
			<table id="tbl_overview" class="mdl-data-table mdl-js-data-table mdl-shadow--2dp">
			  <thead>
				<tr>
				  <th>btc</th>
				  <th><?php echo $_REQUEST['coin']; ?></th>
				  <th>btc</th>
				  <th>profit</th>
				  <th>trades</th>
				  <th>last update</th>
				</tr>
			  </thead>
			  <tbody>
				<tr>
				  <td id="balance_cash"></td>
				  <td id="balance_btc"></td>
				  <td id="future_cash"></td>
				  <td id="overview_profit"></td>
				  <td id="overview_trades"></td>
				  <td id="overview_last_update"></td>
				</tr>
			  </tbody>
			</table>
			
			<div id="orders">
				<div class="buy">
					<table id="tbl_buy_stat" class="mdl-data-table mdl-js-data-table mdl-shadow--2dp">
						<thead>
							<tr>
								<th>frequency</th>
								<th>mean amount</th>
								<th>total amount</th>
							</tr>
						</thead>
						<tbody>
						</tbody>
					</table>
					<table id="tbl_buy" class="mdl-data-table mdl-js-data-table mdl-shadow--2dp">
						<thead>
							<tr>
								<th>position</th>
								<th>total</th>
								<th>price</th>
								<th>profit</th>
								<th>min_profit</th>
							</tr>
						</thead>
						<tbody>
						</tbody>
					</table>
		
					<table id="tbl_buy_history" class="mdl-data-table mdl-js-data-table mdl-shadow--2dp">
					  <thead>
						<tr>
						  <th>date</th>
						  <th>price</th>
						  <th>total</th>
						</tr>
					  </thead>
					  <tbody>
					  </tbody>
					</table>
				</div>
				<div class="sell">
					<table id="tbl_sell_stat" class="mdl-data-table mdl-js-data-table mdl-shadow--2dp">
						<thead>
							<tr>
								<th>frequency</th>
								<th>mean amount</th>
								<th>total amount</th>
							</tr>
						</thead>
						<tbody>
						</tbody>
					</table>
					<table id="tbl_sell" class="mdl-data-table mdl-js-data-table mdl-shadow--2dp">
						<thead>
							<tr>
								<th>position</th>
								<th>total</th>
								<th>price</th>
								<th>profit</th>
								<th>min_profit</th>
							</tr>
						</thead>
						<tbody>
						</tbody>
					</table>
		
					<table id="tbl_sell_history" class="mdl-data-table mdl-js-data-table mdl-shadow--2dp">
					  <thead>
						<tr>
						  <th>date</th>
						  <th>price</th>
						  <th>total</th>
						</tr>
					  </thead>
					  <tbody>
					  </tbody>
					</table>
				</div>
			</div>
		</div>
		<html>
  <head>
    <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
		<div id="aux_arbitrage">	
		</div>
		
		<div id="aux_trades">				
			<table id="tbl_bids" class="mdl-data-table">
			  <thead>
				<tr>
				  <th>percent</th>
				  <th>cumulative</th>
				  <th>amount</th>
				  <th>rate</th>
				</tr>
			  </thead>
			  <tbody>
			  </tbody>
			</table>
			
			<table id="tbl_asks" class="mdl-data-table">
			  <thead>
				<tr>
				  <th>rate</th>
				  <th>amount</th>
				  <th>cumulative</th>
				  <th>percent</th>
				</tr>
			  </thead>
			  <tbody>
			  </tbody>
			</table>
			
			<table id="tbl_trades" class="mdl-data-table">
			  <tbody>
			  </tbody>
			</table>
		</div>
		
		<?php
			include 'php/polo.php';
		?>
		
		<script>
		<?php
			echo ' var coin = "'.strtoupper($_REQUEST['coin']).'"';	
		?>
		</script>
		
		<div id="stats">
			<div id="rate_charts" class="chart">
				<div id="buy_scatter_rate_chart" class="chart"></div>
				<div id="sell_scatter_rate_chart" class="chart"></div>
				<div id="rate_chart" class="chart"></div>
			</div>
			<div id="force_chart" class="chart"></div>
			<!--div id="wall_chart" class="chart">
				<div id="bid_chart"></div>
				<div id="ask_chart"></div>
			</div-->
		</div>
			
		<script src="js/generic.js"></script>
		<script src="js/polo.js"></script>
		<script src="js/utils.js"></script>
		<script src="js/order.js"></script>
		<script src="js/core.js"></script>	
		<script src="js/script.js"></script>
		
    </body>
</html> 