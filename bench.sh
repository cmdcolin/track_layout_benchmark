#!/bin/bash
export NODE_OPTIONS="--experimental-strip-types"

# Default implementations to test
if [ $# -eq 0 ]; then
  echo "Usage: ./bench.sh <impl1> <impl2> ..."
  echo ""
  echo "Available implementations:"
  echo "  arrsimple bitset endarr flatqueue gran gran_intervals"
  echo "  gran_ultra gran_unsorted gran_v3 gran_v4 gran_v5 iv1 iv2"
  echo ""
  echo "Examples:"
  echo "  ./bench.sh gran gran_ultra flatqueue"
  exit 1
fi

# Extract implementations and size
IMPLS=()
SIZE2=100000

# Build hyperfine commands
CMDS2=()
for impl in "$@"; do
  CMDS2+=("node src/bench/${impl}.ts ${SIZE2}")
done
echo ""
echo "=========================================="
echo "Benchmarking with $(printf "%'d" $SIZE2) rectangles"
echo "=========================================="
hyperfine -r 4 "${CMDS2[@]}"
