define(['elasticsearch', 'config'], function (elasticsearch, config){
  var d3_button_binding = "context-button";
  var menu = document.createElement("NAV");
  var lv1 = document.createElement("UL");
  var lv1_list = document.createElement("LI");
  var lv1_link = document.createElement("A");
  lv1_link.className = d3_button_binding;
  lv1_link.href = "#"

  lv1_link.appendChild(document.createTextNode(config.ruleset_index));
  lv1_list.appendChild(lv1_link);
  var client = new elasticsearch.Client(config.serverOptions);
  client.search(config.getTypesInRulesetIndex).then(function (response){
    var types = response.aggregations.count_by_type.buckets;
    var lv2 = document.createElement("UL");
    types.forEach(function(d){
      var lv2_list = document.createElement("LI");
      var lv2_link = document.createElement("A");
      lv2_link.href = "#";
      lv2_link.appendChild(document.createTextNode(d.key));
      lv2_link.className = d3_button_binding;
      lv2_list.appendChild(lv2_link);
      lv2.appendChild(lv2_list);

      var files = d.count_by_file.buckets;
      var lv3 = document.createElement("UL");
      files.forEach(function(d){
        var lv3_list = document.createElement("LI");
        var lv3_link = document.createElement("A");
        lv3_link.href = "#";
        lv3_link.appendChild(document.createTextNode(d.key));
        lv3_list.appendChild(lv3_link);
        lv3.appendChild(lv3_list);
      });
      lv2_list.appendChild(lv3);
    });

    lv1_list.appendChild(lv2);
  });

  lv1.appendChild(lv1_list);
  menu.appendChild(lv1);
  document.getElementById("menu").appendChild(menu);

});