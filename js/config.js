define(['config'], function () {
  var ruleset_index = "ruleset";
  var serverOptions = {
    host: {
      protocol: 'http',
      host: '192.168.56.20',
      port: '9200'
    }
  };
  var getTypesInRulesetIndex = {
    index: ruleset_index,
    size: 0,
    body: {
      aggs: {
        count_by_type: {
          terms: {
            field: "_type"
          },
          aggs: {
            count_by_file: {
              terms: {
                field: "file",
                size : 50
              }
            }
          }
        }
      }
    }
  };
  return {
    serverOptions: serverOptions,
    ruleset_index: ruleset_index,
    getTypesInRulesetIndex: getTypesInRulesetIndex
  }
});