#!/bin/bash

# Benchmark all implementations
ALL_IMPLS=(
  "arrsimple"
  "endarr"
  "flatqueue"
  "gran"
  "gran_intervals"
  "gran_ultra"
  "gran_unsorted"
  "iv1"
  "iv2"
)

# Pass through any size argument
./bench.sh "${ALL_IMPLS[@]}" "$@"
