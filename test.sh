export NODE_OPTIONS="--experimental-strip-types" 
echo $1
hyperfine -r 1 "node src/test/arrsimple.ts $1" "node src/test/gran.ts $1" "node src/test/intervaltree.ts $1" "node src/test/bitset.ts $1"
