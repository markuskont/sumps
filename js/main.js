// Filename: main.js

// Require.js allows us to configure shortcut alias
require.config({
  paths: {
    d3: 'libs/d3/d3',
    elasticsearch: 'libs/elasticsearch/elasticsearch'
  }
});

// Here we pull javascript files into scope
require(['graph/00-overview']);