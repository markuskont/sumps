define(['d3', 'elasticsearch', 'config'], function (d3, elasticsearch, config){

  var client = new elasticsearch.Client(config.serverOptions);

  var menu = d3.select("#menu").append("ul");

  client.search(config.getTypesInRulesetIndex).then(function(response){
    var data = response.aggregations['count_by_type'].buckets;
    menu.selectAll("li")
      .data(data)
      .enter()
      .append("li")
      .append("a")
      .text(function(d) { return d['key']; })
      .on("click", click);
  });

  function click(d) {
    d3.select("li")
      .on("click", null)
      .append("ul")
      .selectAll("li")
      .data(d['count_by_file'].buckets)
      .enter()
      .append("li")
      .append("a")
      .text(function(d) {  
        return d['key']; 
      });
  }
});