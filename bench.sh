export NODE_OPTIONS="--experimental-strip-types" 
hyperfine -r 1 "node src/bench/arrsimple.ts $1" "node src/bench/gran.ts $1" "node src/bench/iv.ts $1" "node src/bench/bitset.ts $1" "node src/bench/iv2.ts $1" "node src/bench/leftarray.ts $1"
