#!/bin/bash

# Benchmark all implementations with tall screen (50k rects)
ALL_IMPLS_TALL=(
  "arrsimple_tall"
  "endarr_tall"
  "flatqueue_tall"
  "gran_tall"
  "gran_ultra_tall"
  "iv1_tall"
  "iv2_tall"
)

export NODE_OPTIONS="--experimental-strip-types"

# Build hyperfine commands
CMDS=()
for impl in "${ALL_IMPLS_TALL[@]}"; do
  CMDS+=("node src/bench/${impl}.ts")
done

echo "=========================================="
echo "Benchmarking TALL screen (5000x20000) with 50,000 rectangles"
echo "Testing: ${ALL_IMPLS_TALL[*]}"
echo "=========================================="
hyperfine -r 4 "${CMDS[@]}"
