var fs = require('fs');
var http = require('http');
var LineByLineReader = require('line-by-line');
// var merge = require('merge');

if (process.argv.length <= 2) {
  console.log("Usage: " + __filename + " path/to/directory");
  process.exit(-1);
}

var path = process.argv[2];

fs.readdir(path, function(err, items) {
  // console.log(items);
  for (var i=0; i<items.length; i++) {
    // console.log(items[i]);
    // var file = path + items[i];
    if ( filenameEndsWith(items[i],'.rules'))
        // console.log(file);
      readFile(path,items[i])
  }
});

function filenameEndsWith(str,suffix) {
  var reguex= new RegExp(suffix+'$');

  if (str.match(reguex)!=null)
    return true;

  return false;
}

/**
 * Parses string containing key-value pair into value
 * prunes the returned string from leading whitespace
 * Removes any double quotes which encapsulate the string
 * If separator can not be found, then processed string is assumed key and boolean 1 is returned
 * @param string
 */
function getValue(string){

  var separator = string.indexOf(':');
  var next;
  // it is difficult to parse pcre field with regex, thus only use them to remove leading and trailing quotes
  if (separator != -1) {
    next = separator + 1;
    var value = string.substring(next,string.length).trim();
    return value.replace(/^"(.+(?="$))"$/, '$1');
  } else {
    return true
  }
}

/**
 * Take object and check type
 * Convert to array if string, else add value
 * String checking disabled for the time being
 * @param obj
 * @param value
 * @returns array with value added to it
 */
/** 
function addValue(obj,value) {
  if (isArray(obj)) {
    //arr = obj.push(value);
    obj.push(value);
    return obj;
  } else {
    //console.log('not array');
    var arr = [];
    arr.push(obj);
    arr.push(value);
    return arr;
  }
}
*/

/**
 * https://www.whatsnoodle.com/check-variable-is-array-in-javascript/
 */
function isArray(check_var) {
    return(Object.prototype.toString.call( check_var ) === '[object Array]');
}

/**
 * http://stackoverflow.com/questions/4059147/check-if-a-variable-is-a-string
 * http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
 */
function isString(check_var) {
    return(Object.prototype.toString.call( check_var ) === '[object String]');
}

/**
 * Parse the Rule parameters between {} and group them into arrays.
 * Related parameters (e.g., content modifiers) are grouped together.
 * @param opts
 * @returns Array containing grouped parameters
 */
function parseSequence(opts) {

  json = {};
  breakpoint = 0;
  group = 0;
  key = "";
  
  /**
  * Suricata-only content modifiers: "replace", "http_server_body", "http_user_agent"
  */
  var contentModifiers = [  
                            "nocase",
                            "rawbytes",
                            "depth",
                            "offset",
                            "distance",
                            "within",
                            "http_client_body",
                            "http_cookie",
                            "http_raw_cookie",
                            "http_header",
                            "http_raw_header",
                            "http_method",
                            "http_uri",
                            "http_raw_uri",
                            "http_stat_code",
                            "http_stat_msg",
                            "fast_pattern",
                            "hash",
                            "length",
                            "isdataat",
                            "replace",
                            "http_server_body",
                            "http_user_agent"
                          ];

  //stream.pause();
  for (var i = 0; i < opts.length; i++) {
    if ( /;/.test(opts[i]) && !/\\/.test(opts[i - 1]) ){
      var pair = opts.substring(breakpoint, i);
  
      param = pair.split(':')[0].trim();
      value = getValue(pair);
  
      // Increment the parameter value only when the parameter is NOT a content modifer, OR...
      // "isdataat" increments the parameter value when its own "relative" modifier is NOT set.
      if ((contentModifiers.indexOf(param) == -1) || (param == "isdataat" && value.indexOf("relative") == -1)) {
        group++;
        key = "p" + group;
        json[key] = {};
      }
  
      json[key][param] = value;
      breakpoint = i + 1;
  
      /** old solution **
      if (json[key]){
        json[key] = addValue(json[key], value);
      } else {
        json[key] = value;
      }*/
      //console.log(key + ' : ' + param + ' : ' + value); //debug
      }
  }
  //stream.resume();
  //console.log(JSON.stringify(json)); //debug
  return json;
}

/**
 * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
 * @param obj1
 * @param obj2
 * @returns obj3 a new object based on obj1 and obj2
 */
function merge_options(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

function readFile(path,fileName) {
  var file = path + fileName;
  var stream = new LineByLineReader(file);
  var regex = new RegExp('^(alert|pass|drop|reject) (\\S+) (\\S+) (\\S+) ([<-]>) (\\S+) (\\S+) \\((.+)\\)');


  stream.on('line', function(line) {
    if (line.match(regex)!=null) {

      var opts = parseSequence(line.match(regex)[8]);

      var signature = {
        "file": fileName,
        "action": line.match(regex)[1],
        "proto": line.match(regex)[2],
        "src_addr": line.match(regex)[3],
        "src_port": line.match(regex)[4],
        "destination" : line.match(regex)[5],
        "dst_addr": line.match(regex)[6],
        "dst_port": line.match(regex)[7],
        "parameters": opts
      }
      // I assume that keys in both hashes are distinct
      // var merged = merge_options(signature, opts)
      console.log(JSON.stringify(signature));
    }
  });
}
