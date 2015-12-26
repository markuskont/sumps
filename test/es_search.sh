#!/bin/bash

curl -XPOST http://192.168.56.20:9200/ruleset/_search?pretty -d '
{
  size: 0,
  aggs : {
    types : {
      terms : { 
        field : "_type"
      },
      aggs : {
        files : {
          terms : {
            field : "file",
            size : "20"
          }
        }
      }
    }
  }
}
'