export NODE_OPTIONS="--experimental-strip-types" 
echo $1
hyperfine -r 1 "node src/bench/arrsimple.ts $1" "node src/bench/gran.ts $1" "node src/bench/intervaltree.ts $1" "node src/bench/bitset.ts $1"
