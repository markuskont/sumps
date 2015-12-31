define(['d3', 'elasticsearch', 'config'], function (d3, elasticsearch, config){

  var client = new elasticsearch.Client(config.serverOptions);

  var menu = d3.select("#menu");

  client.search(config.getTypesInRulesetIndex).then(function(response){
    var data = response.aggregations['count_by_type'].buckets;
    //console.log(data);
    menu.selectAll("li")
        .data(data)
      .enter().append("li")
        .text(function(d) { return d['key']; })
        .on("click", expand);
    function expand(d) {
      console.log(d);
      d3.select(this)
          .on("click", null)
        .append("ul")
        .selectAll("li")
          .data(d['count_by_file'].buckets)
        .enter().append("li")
          .text(function(d) { console.log(d); return d['key']; });
    }
  });


//  client.search(config.getTypesInRulesetIndex).then(function (response){
//    var menu = d3.select("#menu")
//      .append("nav")
//      .append("ul")
//      .append("li")
//      .attr("id", function(d){
//        return config.ruleset_index;
//      })
//      .append("a")
//      .text(config.ruleset_index)
//      .on("click", expand);
//
//  });
//  function expand(d) {
//    d3.select(this)
//      .on("click", null)
//      .append("ul")
//      .selectAll("li")
//      .data(d.aggregations.count_by_type.buckets)
//      .enter()
//      .append("li")
//      .text(function(d) {return d.key;});
//  }


});