## Background

Genome browsers commonly stack features that occupy genomic ranges on top of
each other sort of like bricks. There are likely other possible applications.
These stackings don't need to be the NP-hard bin-packed optimal layout, just
good enough. It is a little tricky to get the right algorithm to do this
however.

In this repo, I have surveyed a couple of techniques, and put them in a little
benchmark

## Techniques

Some of these are implemented for experimental purposes

### End-array layout

An "end-array" is an idea implemented in gw genome browser
https://www.biorxiv.org/content/10.1101/2024.07.26.605272v3

It uses a single array, with each element of the array representing a row, and
the value of each element of the array keeps track of the current maximum 'end
coordinate' of a feature on that row.

To add a new rectangle to the end-array layout, it iterates over the end-array
array for the first place where the START position of a genomic feature is
greater than a position in the end-array. The first place where the start
position is greater than an element of the end-array means the feature can be
safely 'laid out' there, and the value of that element of the end-array is
updated to the END position of that genomic feature

This layout method works best when in-coming features are sorted by their start
position, otherwise the layout will not have good density

### Granular rect layout

The "Granular rect layout" is a system used in JBrowse 1/2. 2025 update: I had
Claude Code make some optimizations to it that made it more interval-tree-like,
but instead is an interval array. This is in gran_ultra

It works with each row being an array of binary true/false where true represents
the occupied space

It uses a scaling factor when you are "zoomed out" so that it doesn't represent
1 array element per 1bp but rather e.g. 1 array element per 100bp when you are
zoomed out (in the code, it calls this scaling factor the "pitchX")

To add a new rectangle to the layout, it looks at each row, finds if it is
occupied anywhere in the region you want to place the rect, and if it is
occupied there, it checks the next row, and so on

This layout method does not require any particular sorting, though sorting may
increase the density of the resulting layout

### Interval tree

Interval tree is an interesting data structure that lets you query intervals,
and we can imagine each row with its own interval tree to query the occupancy of
a given genomic range. It is O(log(n)) for "queries".

This implementation I used is similar to the granular rect layout but instead of
an array-per-row, it is a interval-tree-per-row

I used two different interval tree libraries for testing hence iv1 and iv2

This layout method does not require any particular sorting, though sorting may
increase the density of the resulting layout

In 2025

## Rendered images

I created rendered images of the resulting layouts in img folder, example

![](img/endarr.png)

## Benchmark output

```
==========================================
Benchmarking with 1,000 rectangles
Testing: arrsimple endarr flatqueue gran gran_intervals gran_ultra gran_unsorted iv1 iv2
==========================================
Benchmark 1: node src/bench/arrsimple.ts 1000
  Time (mean ± σ):      3.516 s ±  0.228 s    [User: 3.402 s, System: 0.170 s]
  Range (min … max):    3.269 s …  3.718 s    4 runs

Benchmark 2: node src/bench/endarr.ts 1000
  Time (mean ± σ):      3.639 s ±  0.223 s    [User: 3.473 s, System: 0.210 s]
  Range (min … max):    3.442 s …  3.881 s    4 runs

Benchmark 3: node src/bench/flatqueue.ts 1000
  Time (mean ± σ):      3.564 s ±  0.119 s    [User: 3.390 s, System: 0.224 s]
  Range (min … max):    3.403 s …  3.667 s    4 runs

Benchmark 4: node src/bench/gran.ts 1000
  Time (mean ± σ):      3.810 s ±  0.266 s    [User: 3.701 s, System: 0.195 s]
  Range (min … max):    3.483 s …  4.118 s    4 runs

Benchmark 5: node src/bench/gran_intervals.ts 1000
  Time (mean ± σ):      3.541 s ±  0.114 s    [User: 3.431 s, System: 0.166 s]
  Range (min … max):    3.376 s …  3.633 s    4 runs

Benchmark 6: node src/bench/gran_ultra.ts 1000
  Time (mean ± σ):      3.498 s ±  0.054 s    [User: 3.372 s, System: 0.191 s]
  Range (min … max):    3.437 s …  3.549 s    4 runs

Benchmark 7: node src/bench/gran_unsorted.ts 1000
  Time (mean ± σ):      3.599 s ±  0.073 s    [User: 3.521 s, System: 0.208 s]
  Range (min … max):    3.548 s …  3.705 s    4 runs

Benchmark 8: node src/bench/iv1.ts 1000
  Time (mean ± σ):      3.680 s ±  0.153 s    [User: 3.704 s, System: 0.189 s]
  Range (min … max):    3.542 s …  3.898 s    4 runs

Benchmark 9: node src/bench/iv2.ts 1000
  Time (mean ± σ):      3.580 s ±  0.159 s    [User: 3.546 s, System: 0.216 s]
  Range (min … max):    3.432 s …  3.805 s    4 runs

Summary
  node src/bench/gran_ultra.ts 1000 ran
    1.01 ± 0.07 times faster than node src/bench/arrsimple.ts 1000
    1.01 ± 0.04 times faster than node src/bench/gran_intervals.ts 1000
    1.02 ± 0.04 times faster than node src/bench/flatqueue.ts 1000
    1.02 ± 0.05 times faster than node src/bench/iv2.ts 1000
    1.03 ± 0.03 times faster than node src/bench/gran_unsorted.ts 1000
    1.04 ± 0.07 times faster than node src/bench/endarr.ts 1000
    1.05 ± 0.05 times faster than node src/bench/iv1.ts 1000
    1.09 ± 0.08 times faster than node src/bench/gran.ts 1000

==========================================
Benchmarking with 100,000 rectangles
Testing: arrsimple endarr flatqueue gran gran_intervals gran_ultra gran_unsorted iv1 iv2
==========================================
Benchmark 1: node src/bench/arrsimple.ts 100000
  Time (mean ± σ):     34.144 s ±  0.756 s    [User: 34.223 s, System: 0.179 s]
  Range (min … max):   33.175 s … 34.877 s    4 runs

Benchmark 2: node src/bench/endarr.ts 100000
  Time (mean ± σ):      3.763 s ±  0.096 s    [User: 3.704 s, System: 0.176 s]
  Range (min … max):    3.629 s …  3.834 s    4 runs

Benchmark 3: node src/bench/flatqueue.ts 100000
  Time (mean ± σ):      3.929 s ±  0.064 s    [User: 3.868 s, System: 0.183 s]
  Range (min … max):    3.857 s …  3.996 s    4 runs

Benchmark 4: node src/bench/gran.ts 100000
  Time (mean ± σ):     12.912 s ±  0.560 s    [User: 14.317 s, System: 0.964 s]
  Range (min … max):   12.245 s … 13.615 s    4 runs

Benchmark 5: node src/bench/gran_intervals.ts 100000
  Time (mean ± σ):     11.807 s ±  0.551 s    [User: 11.978 s, System: 0.219 s]
  Range (min … max):   11.347 s … 12.569 s    4 runs

Benchmark 6: node src/bench/gran_ultra.ts 100000
  Time (mean ± σ):      8.662 s ±  0.640 s    [User: 8.655 s, System: 0.197 s]
  Range (min … max):    8.244 s …  9.615 s    4 runs

Benchmark 7: node src/bench/gran_unsorted.ts 100000
  Time (mean ± σ):     37.915 s ±  1.480 s    [User: 39.454 s, System: 1.513 s]
  Range (min … max):   36.028 s … 39.379 s    4 runs

Benchmark 8: node src/bench/iv1.ts 100000
  Time (mean ± σ):     41.364 s ±  1.401 s    [User: 41.984 s, System: 0.326 s]
  Range (min … max):   40.434 s … 43.433 s    4 runs

Benchmark 9: node src/bench/iv2.ts 100000
  Time (mean ± σ):     96.353 s ±  5.446 s    [User: 96.533 s, System: 0.287 s]
  Range (min … max):   91.889 s … 104.199 s    4 runs

Summary
  node src/bench/endarr.ts 100000 ran
    1.04 ± 0.03 times faster than node src/bench/flatqueue.ts 100000
    2.30 ± 0.18 times faster than node src/bench/gran_ultra.ts 100000
    3.14 ± 0.17 times faster than node src/bench/gran_intervals.ts 100000
    3.43 ± 0.17 times faster than node src/bench/gran.ts 100000
    9.07 ± 0.31 times faster than node src/bench/arrsimple.ts 100000
   10.08 ± 0.47 times faster than node src/bench/gran_unsorted.ts 100000
   10.99 ± 0.47 times faster than node src/bench/iv1.ts 100000
   25.60 ± 1.59 times faster than node src/bench/iv2.ts 100000
```

## Next steps

- Experiment with freeing layout memory when no longer used. How this is done
  may vary based on the approach
- See if there are other references to algorithms like this from outside the
  bioinformatics-sphere (masonry layout in CSS?)
