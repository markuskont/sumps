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
    //drawBarChart(RulesetTypes);
    testChart(RulesetTypes);
    //exampleChart();
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

  function testChart(data) {

    var yBar = height / data.length;
    var xBar = d3.scale.linear()
          .domain([0, d3.max(data, function(d){ return d.doc_count; })])
          .range([0, width]);

    var barPadding = 2;

    var graph = createSvg("#container", height, width);
    //var attributes = {
    //  width: function(d) {
    //    return xBar(d.doc_count);
    //  },
    //  height: 
    //};

    graph.selectAll('rect')
      .data(data, function (d) {
        //console.log(d.doc_count);
        return d.doc_count; 
      })
      .enter()
      .append('rect')
      .attr('width', function(d){
        return xBar(d.doc_count);
      })
      .attr('height', yBar - barPadding)
      .attr('y', function(d, i) {
        return i * (height / data.length );
      }); 
  }

  function exampleChart() {
    var data = [4, 8, 15, 16, 23, 42];

    var svgHeight = 100;
    var svgWidth = 600;
    var barPadding = 1;

    var graph = createSvg("#container", svgHeight, svgWidth);
    graph.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('width', svgWidth / data.length - barPadding)
      .attr('height', function(d) {
        return d * 4;
      })
      .attr('x', function(d, i) {
        return i * (svgWidth / data.length);
      })
      .attr('y', function(d) {
        return svgHeight - (d * 4);
      });
      //.append("text");
  }

  function createSvg (parent, height, width) {
    return d3.select(parent).append("svg").attr("height", height).attr("width", width);
  }
  
//
//  console.log(d3.version);
});