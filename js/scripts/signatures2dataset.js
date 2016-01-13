var fs = require('fs');
var http = require('http');
var LineByLineReader = require('line-by-line');
var yamlParser = require('yamljs')
// var merge = require('merge');

if (process.argv.length <= 2) {
  console.log("Usage: " + __filename + " path/to/directory [path/to/conffile]");
  process.exit(-1);
}

var path = process.argv[2];
var expand = 0;
var ipvars = [];
var portvars = {};

// Parse conf for expanding variables
if (process.argv[3]) {
  parseConf(process.argv[3])
}

fs.readdir(path, function(err, items) {
  // console.log(items);
  for (var i=0; i<items.length; i++) {
    // console.log(items[i]);
    // var file = path + items[i];
    if ( filenameEndsWith(items[i],'\.rules'))
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
 * Parses the IP and Port variables from conf files.
 * Populates the global 'ipvars' and 'portvars' variables.
 * @param path to conf file
 */
function parseConf (file) {
    expand = 1;
    
    //If the file is not YAML (Suricata conf), then it will look for Snort specific keywords, or else it will fail.
    var content = fs.readFileSync(file, 'utf8');
    if (content.indexOf('%YAML') != -1) { // Suricata
      var nativeObject = yamlParser.load(file);
      ipvars = nativeObject['vars']['address-groups'];
      portvars = nativeObject['vars']['port-groups'];
    }
    else if (content.indexOf('ipvar')){ // Snort
      var pattern = new RegExp(/(ipvar|portvar) (\S+) (\S+)/gm);
      var found = content.match(pattern);
      
      for (var i = 0; i < found.length; i++) {
        var line = found[i];
        if (line.indexOf('ipvar') != -1) {
          var res = (line.substr(line.indexOf(' ')+1).split(' '));
          ipvars[res[0]] = res[1];
        } else {
          var res = (line.substr(line.indexOf(' ')+1).split(' '));
          portvars[res[0]] = res[1];
        }
      }
    }
    else { // bail out
      console.err("Could not parse variables from the specified configuration file");
      process.exit(-2);
    }
    //console.log(ipvars + portvars); //debug
}

/**
 * Expands variables if the provided input string contains them.
 * @param type - type of variable (IP or port)
 * @param check_var - variable to check and expand
 * @returns Expanded check_var value
 */
function expandVars(type, check_var) {
    if (expand == 0)
        return check_var;
      
    //console.log("IPUT: " + check_var); //debug
    check_var = check_var.toString();
    var pattern = new RegExp(/\$([A-Za-z0-9_-]+)/g);
    var found = check_var.match(pattern);
    //console.log("FOUND: " + found); //debug

    if (found) {
      for (var i=0; i < found.length; i++) {
        match = found[i];
        if (type == 'addr') {
                    check_var = check_var.replace(match, ipvars[match.substr(1)]);
        } else {
                    check_var = check_var.replace(match, portvars[match.substr(1)]);
        }
      }
      // Check if the new value was perhaps still a variable containing a $
      check_var = expandVars(type, check_var);
    }
    //console.log("OPUT: " + check_var); //debug
    return check_var;
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

  var obj = {};
  nested = [];
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
  
      // Increment the parameter value only when the parameter is NOT a content modifer
      if (contentModifiers.indexOf(param) == -1) {
        group++;
        key = "p" + group;
        obj = {};
      }
  
      obj[param] = value;
      nested.push(obj);
      breakpoint = i + 1;
    }
  }
  //stream.resume();
  //console.log(JSON.stringify(json)); //debug
  return nested;
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
  var regex = new RegExp('^(alert|pass|drop|sdrop|reject|log|activate|dynamic) (\\S+) (\\S+) (\\S+) ([<-]>) (\\S+) (\\S+) \\((.+)\\)');

  stream.on('line', function(line) {
    if (line.match(regex)!=null) {

      var opts = parseSequence(line.match(regex)[8]);
            
      var signature = {
        "file": fileName,
        "action": line.match(regex)[1],
        "proto": line.match(regex)[2],
        "src_addr": expandVars('addr', line.match(regex)[3]),
        "src_port": expandVars('port', line.match(regex)[4]),
        "destination": line.match(regex)[5],
        "dst_addr": expandVars('addr', line.match(regex)[6]),
        "dst_port": expandVars('port', line.match(regex)[7]),
        "parameters": opts
      }
      
      // I assume that keys in both hashes are distinct
      // var merged = merge_options(signature, opts)
      //console.log(line); //original rule debug
      console.log(JSON.stringify(signature));
    }
  });
}
