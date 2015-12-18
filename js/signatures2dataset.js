var fs = require('fs');
var http = require('http');
var LineByLineReader = require('line-by-line');

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

function parseSignatureOpts(opts) {
  // remove leading whitespace before semicolon, pretty common in ruleset
  var normalized = opts.replace(/; /g, ";")
  // split 
  var elements = normalized.split(';');
  var json = {};

  // split array elements into key-value pairs
  // return boolean if key has no value
  for (i=0; i < elements.length; ++i) {
    var pair = elements[i].split(':');
    key = pair[0];
    value = pair[1];
    // last element is still delimited with semicolon
    // results in empty key
    if (key.length) {
      // build array if same key exists multiple times (e.g. pattern fields)
      if (key in json) {
        //// if array exists then push new value into it
        //if(typeof array != "undefined" && array != null && array.length > 0){
        //  array.push(value);
        //} else {
        //  // else construct it and add initial values
        //  var array = [];
        //  array.push(json[key]);
        //  json[key] = array;
        //}
        // console.log(array);
      } else {
        json[key] = value;
      }
    }
    //console.log(elements[i].split(':'));
  }
  return json;
}

function readFile(path,fileName) {
  var file = path + fileName;
  var stream = new LineByLineReader(file);
  var regex = new RegExp('^(alert|drop) (\\S+) (\\S+) (\\S+) -> (\\S+) (\\S+) \\((.+)\\)');

  stream.on('line', function(line) {
    if (line.match(regex)!=null) {

      //var opts = line.match(regex)[7];
      var opts = parseSignatureOpts(line.match(regex)[7]);
      // console.log(opts);

      var signature = {
        "file": fileName,
        "action": line.match(regex)[1],
        "proto": line.match(regex)[2],
        "src_addr": line.match(regex)[3],
        "src_port": line.match(regex)[4],
        "dst_addr": line.match(regex)[5],
        "dst_port": line.match(regex)[6],
        "opts": opts
      }
      console.log(JSON.stringify(signature));
    }
  });
}