<?php

header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json; charset=utf-8');

defined('DS') ? null : define('DS', DIRECTORY_SEPARATOR);
require_once('.'.DS.'htmlpurifier-4.6.0-standalone'.DS.'HTMLPurifier.standalone.php');
$purifier = new HTMLPurifier();

$get = array('collection', 'f', 'q', 'c');
$status = true;
foreach($get as $param){
    if(!isset($_GET[$param])){
        $status = false;
        break;
    } else {
        $$param = $purifier->purify($_GET[$param]);
    }
}

if ($status) {
    $url  = 'https://api.mongolab.com/api/1/databases/routine/collections/'.$collection.'?';
    $url .= 'f='.$f.'&';
    $url .= 'q='.$q.'&';
    $url .= 'c='.$c.'&';
    $url .= 'apiKey=Your Mongo Lab API key';
    echo  trim(file_get_contents($url));
} else {
    echo 'Hack Attempt?';
}
