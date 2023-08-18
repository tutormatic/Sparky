#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./sparky.sh <File>"
    exit 1
fi

code="$1"

node ./src/parser.js "$code"