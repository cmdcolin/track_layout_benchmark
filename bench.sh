#!/bin/bash
export NODE_OPTIONS="--experimental-strip-types"

echo "=========================================="
echo "Benchmarking with 10,000 rectangles"
echo "=========================================="
hyperfine -r 1 --warmup 1 \
  "node src/bench/gran.ts 10000" \
  "node src/bench/gran_ultra.ts 10000" \
  "node src/bench/gran_v5.ts 10000"

echo ""
echo "=========================================="
echo "Benchmarking with 100,000 rectangles"
echo "=========================================="
hyperfine -r 1 --warmup 1 \
  "node src/bench/gran.ts 100000" \
  "node src/bench/gran_ultra.ts 100000" \
  "node src/bench/gran_v5.ts 100000"
