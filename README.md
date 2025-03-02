## Benchmark

```

$ ./bench.sh 10000
Benchmark 1: node src/bench/arrsimple.ts 10000
  Time (abs ≡):        419.1 ms               [User: 441.1 ms, System: 32.1 ms]

Benchmark 2: node src/bench/gran.ts 10000
  Time (abs ≡):        329.6 ms               [User: 378.4 ms, System: 48.9 ms]

Benchmark 3: node src/bench/iv.ts 10000
  Time (abs ≡):         1.237 s               [User: 1.334 s, System: 0.052 s]

Benchmark 4: node src/bench/bitset.ts 10000
  Time (abs ≡):         4.816 s               [User: 4.900 s, System: 0.059 s]

Benchmark 5: node src/bench/iv2.ts 10000
  Time (abs ≡):         5.067 s               [User: 5.182 s, System: 0.059 s]

Benchmark 6: node src/bench/leftarray.ts 10000
  Time (abs ≡):        166.5 ms               [User: 174.2 ms, System: 24.7 ms]

Summary
  node src/bench/leftarray.ts 10000 ran
    1.98 times faster than node src/bench/gran.ts 10000
    2.52 times faster than node src/bench/arrsimple.ts 10000
    7.43 times faster than node src/bench/iv.ts 10000
   28.93 times faster than node src/bench/bitset.ts 10000
   30.44 times faster than node src/bench/iv2.ts 10000
Done in 12.10s.
```
