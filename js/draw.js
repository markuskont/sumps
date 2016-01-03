define(['d3'], function (d3){
  return {
    CreateSVG: function( parent, height, width ) {
      return d3.select(parent).append("svg").attr("height", height).attr("width", width);
    }
  }
});