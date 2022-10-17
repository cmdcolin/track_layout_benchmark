## Benchmark

```
% hyperfine -r 1 'node dist/bench_arrsimple.js' 'node dist/bench_gran.js' 'node dist/bench_intervaltree.js' 'node dist/bench_bitset.js'
Benchmark 1: node dist/bench_arrsimple.js
  Time (abs ≡):        15.223 s               [User: 15.279 s, System: 0.048 s]

Benchmark 2: node dist/bench_gran.js
  Time (abs ≡):        11.022 s               [User: 11.261 s, System: 0.088 s]

Benchmark 3: node dist/bench_intervaltree.js
  Time (abs ≡):         7.928 s               [User: 8.105 s, System: 0.060 s]

Benchmark 4: node dist/bench_bitset.js
  Time (abs ≡):        38.741 s               [User: 38.587 s, System: 0.172 s]

Summary
  'node dist/bench_intervaltree.js' ran
    1.39 times faster than 'node dist/bench_gran.js'
    1.92 times faster than 'node dist/bench_arrsimple.js'
    4.89 times faster than 'node dist/bench_bitset.js'

```
