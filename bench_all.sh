#!/bin/bash

# Benchmark all implementations
ALL_IMPLS=(
  "arrsimple"
  "endarr"
  "flatqueue"
  "gran"
  "gran_ultra"
  "iv1"
)

# Pass through any size argument
./bench.sh "${ALL_IMPLS[@]}" "$@"
