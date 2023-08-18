#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./sparky.sh <code>"
    exit 1
fi

code="$1"

node parser.js "$code"