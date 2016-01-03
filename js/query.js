define(['elasticsearch', 'config', 'menu', 'graph'], function (elasticsearch, config, menu, graph){

  var client = new elasticsearch.Client(config.serverOptions);

  var margin = {top: 20, right: 50, bottom: 70, left: 50},
      width = window.innerWidth - margin.left - margin.right,
      //width = selection[0][0].clientWidth,
      height = window.innerHeight;

  client.search(config.getTypesInRulesetIndex).then(function(response){
    var data = response.aggregations['count_by_type'].buckets;
    menu.MenuFromQuery(data);

  //  data.forEach(function(d){
  //    var bars = graph.BarChart(d['count_by_file'].buckets, height , width, 'doc_count');
  //  });
  //  var tree = graph.Tree(data, height, width, "#content");
  });
});