/**
 * Courtesy of https://gist.github.com/hillar/4b014ba3abcc07a8c5c9
*/

var readline = require('readline');
var http = require('http');

if ( process.argv.length < 3 ) {
  help();
}

var bites = process.argv[2] || 'localhost:9200/undefined/undefined';
var bites = bites.split(":");
var host = bites[0] || "localhost";
if (!bites[1]) bites[1] = '9200/undefined/undefined'
var bites = bites[1].split("/") || [9200];
var port = parseInt(bites[0]) || 9200;

var options = {
  hostname: host,
  port: port,
  path: '/_cluster/health', // see http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/cluster-health.html
  method: 'GET'
};

callback = function(resp) {
  resp.on('data', function(chunk){
    var health = JSON.parse(chunk) || {};
    if ( health.status && health.status === "green" ) {
      var index = 'undefined';
      var type = 'undefined';
      if ( bites.length > 1 ) {
        index = bites[1];
        if ( bites.length > 2 ) {
          type = bites[2]
        }
      }

      readInput(index, type);
      // console.log('ES OK');
    }
  });
  resp.on('end', function(){
    console.log('callback response end')
  });
}

var req = http.request(options, callback).end();

function readInput (index,type){

  var count = 0;
  var bulk = [];
  var cache = {};
  var bulksize = 1024;

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', function(line){
  
    count++;
    bulk.push(line);
    if (count % bulksize === 0  ) {
      //console.log(index + ' ' + type);
      send2ela(host,port,index,type,bulk, count-bulksize); 
      //stream.pause();
      bulk = [];
    }
  });
  rl.on('close',function(){
    // send leftovers
    send2ela(host,port,index,type,bulk, count-bulksize);
    console.log('sent',count,'lines to',host+':'+port+'/'+index+'/'+type);
    //process.exit(0);
  });
}

function help() {
  console.log("usage:");  
  console.log("pipe.js hostname:port/index/type");
  console.log("");
  console.log(" default index is undefined");
  console.log(" default type is undefined");
  //console.log(" default bulksize is 1024");

  process.exit(0);
}

function send2ela(host,port,index,type,bufs,start){
  // check only first in bufs
  if (!bufs[0]) return;

  var test; 
  try {
    test = JSON.parse(bufs[0].toString());
  } catch (e) {
    console.error('not JSON :: ',e);
    process.exit(1);
  }
  var i = index || 'undefined';
  var t = type || 'undefined';
  var path = '/'+i+'/'+t+'/_bulk';
  var elastic = {
    hostname: host||'localhost',
    port: port||9200,
    path: path,
    method: 'POST'
  };
  
  var req = http.request(elastic, function(res) {
    var rcount = 0;
    var errors = false;
    var response = '';
    //console.log('STATUS: ' + res.statusCode);
    //console.log('HEADERS: ' + JSON.stringify(res.headers));
    //res.setEncoding('utf8');
    res.on('data', function (chunk) {
      rcount ++;
      if (rcount === 1) {
        //  {"took":7,"errors":true,"items":[{"create":{"_index":"test","_type":"eve","_id":
        var tmp = chunk.toString().substr(0,80);
        errors = tmp.indexOf('"errors":true') != -1 || false;
        if (errors) {
          //console.log('got error ELA: ' + chunk.toString().substr(0,80));
         }
      }
      if (errors) { // collect elasticsearch response only on error
        response += chunk;
      }
    });
    res.on('end',function(){
      if (errors) {
        var test;   
        try {
          test = JSON.parse(response.toString());
        } catch (e) {
          console.error('elasticsearch response is not JSON :: ',e);
          process.exit(1);
        }
        for (var i = 0; i < test.items.length; i++){
          if (test.items[i].create.error) {
            console.error('error in line no:',start +i + 1 , '; status:',test.items[i].create.status,';',test.items[i].create.error.substr(0,130), '... ; ',bufs[i].toString().substr(0,130));
          }
        } 
      }
//      if (stream) stream.resume();
    });
  });
  req.on('error', function(e) {
    console.error('problem with request: ' + e.message);
  });
  // write bufs to request body
  for (var i = 0; i < bufs.length; i++) {
    req.write('{create:{}}\n');
    req.write(bufs[i].toString() + '\n');
    //console.log('sending',bufs[i].toString());
  }
  req.end();
};