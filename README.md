## Benchmark

```

Benchmark 1: node src/bench/arrsimple.ts 1000
  Time (abs ≡):        179.7 ms               [User: 198.1 ms, System: 25.9 ms]

Benchmark 2: node src/bench/gran.ts 1000
  Time (abs ≡):        197.6 ms               [User: 241.5 ms, System: 43.2 ms]

Benchmark 3: node src/bench/iv.ts 1000
  Time (abs ≡):        281.9 ms               [User: 387.9 ms, System: 36.5 ms]

Benchmark 4: node src/bench/bitset.ts 1000
  Time (abs ≡):        510.8 ms               [User: 495.7 ms, System: 36.9 ms]

Benchmark 5: node src/bench/iv2.ts 1000
  Time (abs ≡):        833.0 ms               [User: 846.0 ms, System: 61.1 ms]

Benchmark 6: node src/bench/leftarray.ts 1000
  Time (abs ≡):        315.1 ms               [User: 273.9 ms, System: 37.4 ms]

Summary
  node src/bench/arrsimple.ts 1000 ran
    1.10 times faster than node src/bench/gran.ts 1000
    1.57 times faster than node src/bench/iv.ts 1000
    1.75 times faster than node src/bench/leftarray.ts 1000
    2.84 times faster than node src/bench/bitset.ts 1000
    4.64 times faster than node src/bench/iv2.ts 1000

```
