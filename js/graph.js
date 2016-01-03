define(['d3', 'transform', 'config', 'draw'], function (d3, transform, config, draw){
  return {
    Tree: function( data, height, width, element ) {
      console.log(data);
      var graph = draw.CreateSVG(element, height, width);

      var cluster = d3.layout.cluster()
        .size([height, width - 100]);

      var nodes = cluster.nodes(data),
        links = nodes.links(nodes);
      console.log(nodes);

      return graph;
    },
    Tree_old: function( data, height, width, element ) {
      var transformedData = transform.GetChildren(data, config.ruleset_index);
      var graph = draw.CreateSVG(element, height, width);
  
      var cluster = d3.layout.cluster()
        .size([height, width - 100]);
//        .children(function(d){
//          return RetreiveAggregation(d);
//        });
  
      // projection translates x to y and vice versa
      // svg begins drawing from upper left corner
      // root node would be on upper X axis without projection
      var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });
  
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
        .attr("r", 3);
  
      node.append("text")
        .text(function(d) {
          return d.key + ": " + d.doc_count;
        });
      //d3.select(self.frameElement).style("height", height + "px");
    },
    BarChart: function( data, height, width, fieldToVisualize ){
      /**
        * find the data range
        * data is actually an array of objects, assuming ES aggregated bucket is passed to @param1
        * thus custom function must be used inside d3.max method
        * yes, 0 is hardcoded as current dataset 'doc_count' must be positive integer
        * our SVG cannot handle negative values regardless
        * range is then used to scale value to available bar
        */
      var dataRange = [0, d3.max(data, function(d){ return d[fieldToVisualize]; })];
      var barPadding = 2;
  
      var yBar = height / data.length,
          xBar = d3.scale.linear()
            .domain(dataRange)
            .range([0, width - barPadding]);
          
      var colorScale = d3.scale.linear()
            .domain(dataRange)
            .range([0, 255]);
  
      /**
        * height offset is used as xAxis labels would otherwise be created outside SVG area
        * this should be fixed with proper margins for each SVG
        */
      var graph = draw.CreateSVG("#content", height + 100, width);
      /**
        * code readability will get out of hand, especially for javascript/d3 n00b
        * thus, I really like this notation for attr values
        */
      var attributes = {
        width: function(d) {
          return xBar(d[fieldToVisualize]);
        },
        height: function(d) {
          return yBar - barPadding;
        },
        y: function(d, i) {
          return i * (height / data.length);
        },
        fill: function(d) {
          return "rgb(0, 0, " + Math.round(colorScale(d[fieldToVisualize])) + ")";
        }
      };
      /**
        * SVG begins drawing from top left
        * thus, axis must be pushed downwards with transform
        * class is an arbitrary identifier, and only used for CSS styling 
        */
      var axis_attributes = {
        class: "axis",
        transform: function(d){
          return "translate(0," + height + ")";
        }
      };
  
      /**
        * here we define X axis counter
        * note that "bottom" does not refer to actual placement of axis (sVG still begins drawing from top left)
        * that will later be set with transform/translate
        * scale must be set, for obvious reasons
        */
      var xAxis = d3.svg.axis()
        .scale(xBar)
        .orient("bottom");
  
      /**
        * here we create a "g" or group element for each datapoint
        * bars are later added to each group
        * we could just create rectangles instead, but "rect" element cannot hold any text values
        * thus, we could not create labels on bars
        * with grouping, we can simply create distinct "rect" and "text" elements for each datapoint
        * idea - maybe even create multiple bars from buckets (ES aggregations) and group per parent
        */
      var bar = graph.selectAll("g")
          .data(data, function(d){
            return d.doc_count;
          })
        .enter().append("g");
  
      /**
        * here we create the colored bars
        * bar length refers to value of @param2, as scaled to SVG width
        * Idea - call additional functions on mouseover, currently bar is only painted red for test
        * each click would create a new graph
        */
      bar.append('rect')
        .attr(attributes);
  
      /**
        * here we actually attach the axis to SVG as new group element
        * placement is set in attributes
        */
      graph.append("g")
        .attr(axis_attributes)
        .call(xAxis);

      return graph;
    }
  }
});