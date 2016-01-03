define(['elasticsearch', 'config', 'menu', 'graph'], function (elasticsearch, config, menu, graph){

  var client = new elasticsearch.Client(config.serverOptions);

  var margin = {top: 20, right: 50, bottom: 70, left: 50},
      width = window.innerWidth - margin.left - margin.right,
      //width = selection[0][0].clientWidth,
      height = window.innerHeight * 4;

  client.search(config.getTypesInRulesetIndex).then(function(response){
    menu.MenuFromQuery(response.aggregations['count_by_type'].buckets);

  //  data.forEach(function(d){
  //    var bars = graph.BarChart(d['count_by_file'].buckets, height , width, 'doc_count');
  //  });
    graph.Tree_old(response, height, width, "#content");
  });
});