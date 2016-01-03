define(['d3', 'graph', 'transform'], function (d3, graph, transform){
  return {
    MenuFromQuery: function( data ) {
      /**
        * Create level 1 list items
        */
      d3.select("#menu").append("ul")
        .selectAll("li")
        .data(data)
        .enter()
        .append("li")
        .append("a")
        .text(function(d) { return d['key']; });
      /**
        * Populate level 2 list with aggregated results of field "file" by count
        */
      d3.selectAll("li")
        .append("ul")
        .selectAll("li")
        .data(function (d) {
          return d['count_by_file'].buckets;
        })
        .enter()
        .append("li")
        .append("a")
        .text(function(d){
          return d['key'];
        })
        .on('click', function(d){
          var aggregated = transform.RetreiveAggregation(d);
          console.log(aggregated);
          return graph.BarChart(aggregated, 100, 400, 'doc_count'); 
        });
    }
  };
});