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
      .text(function(d) { return d['key']; });
      //.on("click", click);
    d3.selectAll("li")
      .append("ul")
      .selectAll("li")
      .data(function (d) {
        console.log(d['count_by_file'].buckets);
        return d['count_by_file'].buckets;
      })
      .enter()
      .append("li")
      .append("a")
      .text(function(d){
        return d['key'];
      });
  });
});