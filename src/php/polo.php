<?php 
        class poloniex {
                protected $api_key;
                protected $api_secret;
                protected $trading_url = "https://poloniex.com/tradingApi";
                protected $public_url = "https://poloniex.com/public";
               
                public function __construct($api_key, $api_secret) {
                        $this->api_key = $api_key;
                        $this->api_secret = $api_secret;
                }
				
				private function query(array $req = array()) {
                        // API settings
                        $key = $this->api_key;
                        $secret = $this->api_secret;
                 
                        // generate a nonce to avoid problems with 32bit systems
                        $mt = explode(' ', microtime());
                        $req['nonce'] = $mt[1].substr($mt[0], 2, 6);
                 
                        // generate the POST data string
                        $post_data = http_build_query($req, '', '&');
                        $sign = hash_hmac('sha512', $post_data, $secret);
                 
                        // generate the extra headers
                        $headers = array(
                                'Key: '.$key,
                                'Sign: '.$sign,
                        );
 
                        // curl handle (initialize if required)
                        static $ch = null;
                        if (is_null($ch)) {
                                $ch = curl_init();
                                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                                curl_setopt($ch, CURLOPT_USERAGENT,
                                        'Mozilla/4.0 (compatible; Poloniex PHP bot; '.php_uname('a').'; PHP/'.phpversion().')'
                                );
                        }
                        curl_setopt($ch, CURLOPT_URL, $this->trading_url);
                        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
                        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
                        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
						curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4 );
 
                        // run the query
                        $res = curl_exec($ch);
 
                        if ($res === false) throw new Exception('Curl error: '.curl_error($ch));
                        $dec = json_decode($res, true);
                        if (!$dec){
                                //throw new Exception('Invalid data: '.$res);
                                return false;
                        }else{
                                return $dec;
                        }
                }
               
                protected function retrieveJSON($URL) {					
                        include $URL;
					
                        return true;
                }
               
                public function get_balances() {
                        $query = $this->query(
                                array(
                                        'command' => 'returnBalances'
                                )
                        );
					
						echo json_encode($query);
					
						return $query;
                }
               
                public function get_open_orders($pair) {               
                        $orders = $this->query(
                                array(
                                        'command' => 'returnOpenOrders',
                                        'currencyPair' => strtoupper($pair)
                                )
                        );
					
						
						echo json_encode($orders);
					
						return $orders;
                }
               
                public function get_my_trade_history($pair) {
                        $query = $this->query(
                                array(
                                        'command' => 'returnTradeHistory',
                                        'currencyPair' => strtoupper($pair)
                                )
                        );
					
						echo json_encode($query);
					
						return $query;
                }
               
                public function get_order($pair, $order_number) {
                        $query = $this->query(
                                array(
                                        'command' => 'returnOrderTrades',
                                        'currencyPair' => strtoupper($pair),
                                        'orderNumber' => $order_number
                                )
                        );
					
						echo json_encode($query);
					
						return $query;
                }
               
                public function buy($pair, $rate, $amount) {
                        $query = $this->query(
                                array(
                                        'command' => 'buy',    
                                        'currencyPair' => strtoupper($pair),
                                        'rate' => $rate,
                                        'amount' => $amount
                                )
                        );
					
						echo json_encode($query);
					
						return $query;
                }
               
                public function sell($pair, $rate, $amount) {
                        $query = $this->query(
                                array(
                                        'command' => 'sell',   
                                        'currencyPair' => strtoupper($pair),
                                        'rate' => $rate,
                                        'amount' => $amount
                                )
                        );
					
						echo json_encode($query);
					
						return $query;
                }
               
                public function cancel_order($pair, $order_number) {
                        $query = $this->query(
                                array(
                                        'command' => 'cancelOrder',    
                                        'currencyPair' => strtoupper($pair),
                                        'orderNumber' => $order_number
                                )
                        );
					
						echo json_encode($query);
					
						return $query;
                }
               
                public function withdraw($currency, $amount, $address) {
                        $query = $this->query(
                                array(
                                        'command' => 'withdraw',       
                                        'currency' => strtoupper($currency),                           
                                        'amount' => $amount,
                                        'address' => $address
                                )
                        );
					
						echo json_encode($query);
					
						return $query;
                }
               
                public function get_trade_history($pair,$start) {
                        $trades = $this->retrieveJSON($this->public_url.'?command=returnTradeHistory&currencyPair='.strtoupper($pair).'&start='.$start);
				}
               
                public function get_order_book($pair) {
                        $orders = $this->retrieveJSON($this->public_url.'?command=returnOrderBook&currencyPair='.strtoupper($pair));
				}
               
                public function get_volume() {
                        $volume = $this->retrieveJSON($this->public_url.'?command=return24hVolume');
				}
       
                public function get_ticker($pair = "ALL") {
                        $pair = strtoupper($pair);
                        $prices = $this->retrieveJSON($this->public_url.'?command=returnTicker');
                        if($pair == "ALL"){
                                return $prices;
                        }else{
                                $pair = strtoupper($pair);
                                if(isset($prices[$pair])){
                                        return $prices[$pair];
                                }else{
                                        return array();
                                }
                        }
                }
               
                public function get_trading_pairs() {
                        $tickers = $this->retrieveJSON($this->public_url.'?command=returnTicker');
                        return array_keys($tickers);
                }
               
                public function get_total_btc_balance() {
                        $balances = $this->get_balances();
                        $prices = $this->get_ticker();
                       
                        $tot_btc = 0;
                       
                        foreach($balances as $coin => $amount){
                                $pair = "BTC_".strtoupper($coin);
                       
                                // convert coin balances to btc value
                                if($amount > 0){
                                        if($coin != "BTC"){
                                                $tot_btc += $amount * $prices[$pair];
                                        }else{
                                                $tot_btc += $amount;
                                        }
                                }
 
                                // process open orders as well
                                if($coin != "BTC"){
                                        $open_orders = $this->get_open_orders($pair);
                                        foreach($open_orders as $order){
                                                if($order['type'] == 'buy'){
                                                        $tot_btc += $order['total'];
                                                }elseif($order['type'] == 'sell'){
                                                        $tot_btc += $order['amount'] * $prices[$pair];
                                                }
                                        }
                                }
                        }
 
                        return $tot_btc;
                }
        }


$key = '';//INSERT API KEY
$sec = '';//INSERT API SECRET KEY
$bot = new poloniex($key, $sec);

$coin = 'BTC_'.$_REQUEST['coin'];

if (isset($_REQUEST['start']))
	$start = $_REQUEST['start'];
	
if(isset($_REQUEST['action']) && !empty($_REQUEST['action'])) {
    $action = $_REQUEST['action'];
    switch($action) {
        case 'get_balance' : $bot->get_balances();break;
        case 'get_orders' : $bot->get_open_orders($coin);break;
		case 'get_trades' : $bot->get_trade_history($coin, $start);break;
		case 'get_my_trade_history' : $bot->get_my_trade_history($coin);break;
		case 'get_order': $bot->get_order($coin, $_REQUEST['id']);break;
        case 'get_orderbook' : $bot->get_order_book($coin);break;
        case 'buy' :   $bot->buy($coin, $_REQUEST['price'], $_REQUEST['amount']);break;
        case 'sell' : $bot->sell($coin, $_REQUEST['price'], $_REQUEST['amount']);break;
        case 'cancel' : $bot->cancel_order($coin, $_REQUEST['id']);break;
    }
}
?>