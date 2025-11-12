#!/bin/bash
export NODE_OPTIONS="--experimental-strip-types"

# Default implementations to test
if [ $# -eq 0 ]; then
  echo "Usage: ./bench.sh <impl1> <impl2> ... [size]"
  echo ""
  echo "Available implementations:"
  echo "  arrsimple bitset endarr flatqueue gran gran_intervals"
  echo "  gran_ultra gran_unsorted gran_v3 gran_v4 gran_v5 iv1 iv2"
  echo ""
  echo "Examples:"
  echo "  ./bench.sh gran gran_ultra flatqueue"
  echo "  ./bench.sh gran gran_ultra flatqueue 50000"
  exit 1
fi

# Extract implementations and size
IMPLS=()
SIZE1=1000
SIZE2=100000

for arg in "$@"; do
  # Check if argument is a number (size)
  if [[ "$arg" =~ ^[0-9]+$ ]]; then
    SIZE1=$arg
    SIZE2=$((arg * 10))
  else
    IMPLS+=("$arg")
  fi
done

# Build hyperfine commands
CMDS1=()
CMDS2=()
for impl in "${IMPLS[@]}"; do
  CMDS1+=("node src/bench/${impl}.ts ${SIZE1}")
  CMDS2+=("node src/bench/${impl}.ts ${SIZE2}")
done

echo "=========================================="
echo "Benchmarking with $(printf "%'d" $SIZE1) rectangles"
echo "Testing: ${IMPLS[*]}"
echo "=========================================="
hyperfine -r 4 "${CMDS1[@]}"

echo ""
echo "=========================================="
echo "Benchmarking with $(printf "%'d" $SIZE2) rectangles"
echo "Testing: ${IMPLS[*]}"
echo "=========================================="
hyperfine -r 4 "${CMDS2[@]}"
