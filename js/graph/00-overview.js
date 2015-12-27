define(['d3', 'elasticsearch'], function (d3, elasticsearch) {
  var serverOptions = {
    host: {
      protocol: 'http',
      host: '192.168.56.20',
      port: '9200'
    }
  };
  var query = {
    index: "ruleset",
    size: 0,
    body: {
      aggs : {
        types : {
          terms : { 
            field : "_type"
          },
          aggs : {
            files : {
              terms : {
                field : "file",
                size : 20
              },
              aggs : {
                protocols : {
                  terms : {
                    field : "proto",
                    size : 20
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  var client = new elasticsearch.Client(serverOptions);

  client.search(query).then(function (response){
    var RulesetTypes = response.aggregations.types.buckets;

    drawDonutChart(RulesetTypes);
    drawBarChart(RulesetTypes);
    RulesetTypes.forEach(function(d){
      drawBarChart(d.files.buckets);
      //d.files.buckets.forEach(function(d){
      //  drawBarChart(d.protocols.buckets);
      //  console.log(d);
      //});
    });
    drawTree(response);
  });

  var margin = {top: 20, right: 20, bottom: 70, left: 40},
    width = ( window.innerWidth - margin.left - margin.right ) / 2,
    //width = 600,
    height = 300 - margin.top - margin.bottom;

  function drawDonutChart(data){

    //var width = window.innerWidth / 3;

    var radius = Math.min(width, height) / 2;
    var color = ['#ff7f0e', '#d62728', '#2ca02c', '#1f77b4'];
    var arc = d3.svg.arc()
        .outerRadius(radius - 100)
        .innerRadius(radius);
    var pie = d3.layout.pie()
        .sort(null)
        .value(function (d) { return d.doc_count; });
    var svg = d3.select("#container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width/1.4 + "," + height/2 + ")");
    var g = svg.selectAll(".arc")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "arc");
    g.append("path")
        .attr("d", arc)
        .style("fill", function (d, i) { return color[i]; });
    g.append("text")
        .attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("fill", "white")
        .text(function (d) { return d.data.key; });
  }

  function drawBarChart(data) {

    var dataRange = [0, d3.max(data, function(d){ return d.doc_count; })];
    var barPadding = 2;

    var yBar = height / data.length,
        xBar = d3.scale.linear()
          .domain(dataRange)
          .range([0, width - barPadding]);
        
    var colorScale = d3.scale.linear()
          .domain(dataRange)
          .range([0, 255]);

    var graph = createSvg("#container", height, width);
    var attributes = {
      width: function(d) {
        return xBar(d.doc_count);
      },
      height: function(d) {
        return yBar - barPadding;
      },
      y: function(d, i) {
        return i * (height / data.length);
      },
      fill: function(d) {
        return "rgb(0, 0, " + Math.round(colorScale(d.doc_count)) + ")";
      }
    };

    graph.selectAll('rect')
      .data(data, function (d) {
        return d.doc_count; 
      })
      .enter()
      .append('rect')
      .attr(attributes)
      .on("click", function() {
        d3.select(this).attr("fill", "red");
      });
  }
  function drawTree(data) {

    var treeWidth = 2 * width,
        treeHeight = 6 * height;

    var transformedData = getChildren(data, 'ruleset');

    var cluster = d3.layout.cluster()
      .size([treeHeight, treeWidth - 100]);

    // projection translates x to y and vice versa
    // svg begins drawing from upper left corner
    // root node would be on upper X axis without projection
    var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });

    var graph = createSvg("#container", treeHeight, treeWidth);
    var nodes = cluster.nodes(transformedData),
      links = cluster.links(nodes);

    var node_attributes = {
      class: "node",
      transform: function(d){
        return "translate(" + d.y + "," + d.x + ")";
      }
    };

    var link_attributes = {
      class: "link",
      d: diagonal
    };

    var link = graph.selectAll(".link")
        .data(links)
      .enter().append("path")
        .attr(link_attributes);

    var node = graph.selectAll(".node")
        .data(nodes)
      .enter().append("g")
        .attr(node_attributes);
        
    node.append("circle")
      .attr("r", 3)
    node.append("text")
      //.style("text-anchor", function(d) { return d.children ? "end" : "start"; })
      .text(function(d) {
        return d.key + ": " + d.doc_count;
      });
    //d3.select(self.frameElement).style("height", treeHeight + "px");
  }

  function createSvg (parent, height, width) {
    return d3.select(parent).append("svg").attr("height", height).attr("width", width);
  }
  /**
   * expected nested array format is: 
   * { key1: value, keyN: value, children : { key1: value, keyN: value, children: {..} } } 
   * Explicit keys are used in the example
   * alternative: 
   * A. algorithmic conversion (obj2 = obj.aggregations.X.buckets; in recursion)
   * B. use alternative data(obj, function(D){  return TODO; }), default is { return d.children; } 
   */
  function getChildren (obj, rootnode) {
    root = {};
    root.key = rootnode;
    root.children = obj.aggregations.types.buckets;
    root.children.forEach(function (d) { d.children = d['files'].buckets; });
    root.children.forEach(function (d) { 
      d.children.forEach(function (d) { 
        d.children = d['protocols'].buckets; 
      });
    });

    return root;
  }
  
//
//  console.log(d3.version);
});