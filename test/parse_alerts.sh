#!/bin/bash

function die() { 
    echo "$@" 1>&2
    exit 2
}

# MAIN

echo "Please enter FILE: "
read FILE
echo "Please enter HOST: "
read HOST
echo "Please enter INDEX: "
read INDEX

[ -z $FILE ] && die "FILE not set"
[ -z $HOST ] && die "HOST not set"
[ -z $INDEX ] && die "INDEX not set"

REGEX="`sed 's/\\./\\\./g' <<< \"$HOST\"` suricata: (\{.+\})$"
#sed 's/\./\\./g' <<< "hobbit1.spin.sise"
#echo $REGEX

curl -XDELETE localhost:9200/$INDEX
[ -f $FILE ] && pcregrep -o1 "$REGEX" $FILE | nodejs $PWD/js/scripts/pipe.js localhost:9200/$INDEX/$HOST || echo "$FILE does not exist"

[ -f $FILE ] && pcregrep -o1 "$REGEX" $FILE | wc -l || echo "$FILE does not exist"