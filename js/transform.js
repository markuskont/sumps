define([], function (){
  return {
    /**
     * expected nested array format is: 
     * { key1: value, keyN: value, children : { key1: value, keyN: value, children: {..} } } 
     * Explicit keys are used in the example
     * alternative: 
     * A. algorithmic conversion (obj2 = obj.aggregations.X.buckets; in recursion)
     * B. use alternative data(obj, function(D){  return TODO; }), default is { return d.children; } 
     */
    GetChildren: function( obj, rootnode ) {
      root = {};
      root.key = rootnode;
      root.children = obj.aggregations['count_by_type'].buckets;
      root.children.forEach(function (d) { d.children = d['count_by_file'].buckets; });
      root.children.forEach(function (d) { 
        d.children.forEach(function (d) { 
          d.children = d['count_by_proto'].buckets; 
        });
      });
      return root;
    },
    MenuClick: function( data ) {
      console.log(data);
      console.log(Object.prototype.toString.call( data.key ));
      return data;
    },
    RetreiveAggregation: function( data ) {
      for (var key in data){
        if (Object.prototype.toString.call( data[key] ) === '[object Object]') {
          if ("buckets" in data[key]){
            return data[key].buckets;
          } else {
            return false;
          }
        }        
      }
    }
  }
});