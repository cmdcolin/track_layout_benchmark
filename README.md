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

This layout method works best when incoming features are sorted by their start
position, otherwise the layout will not have good density

### Priority queue layout

This is very similar to the end-array layout, but instead of scanning the
end-array linearly, it has a priority queue that keeps track of the first
available position

This is flatqueue in benchmark and is used by
[GenomeSpy](https://genomespy.app/) and was proposed by Kari Lavikka

### Granular rect layout (w/ "bitmap" layout)

The "Granular rect layout" is a system used in JBrowse 1.

It works with each row being an array of binary true/false, where true
represents the occupied space

It uses a scaling factor when you are "zoomed out" so that it doesn't represent
1 array element per 1bp but rather e.g. 1 array element per 100bp when you are
zoomed out (in the code, it calls this scaling factor the "pitchX")

To add a new rectangle to the layout, it looks at each row, finds if it is
occupied anywhere in the region you want to place the rect, and if it is
occupied there, it checks the next row, and so on

This layout method does not require any particular sorting, though sorting may
increase the density of the resulting layout

### Granular rect layout (w/ interval array)

In 2025, I had Claude Code make some optimizations to make the Granular rect
layout more interval-tree-like, but instead is now an "interval array". So
instead of a bitmap, it just stores an array of intervals in each row. It uses
splice to insert intervals into sorted order. This has a slightly higher upfront
cost, but it is faster to query than the interval tree

This is now used in JBrowse 2 (gran_ultra) in benchmark

### Interval tree

Interval tree is an interesting data structure that lets you query intervals,
and we can imagine each row with its own interval tree to query the occupancy of
a given genomic range. It is O(log(n)) for "queries".

This implementation I used is similar to the granular rect layout but instead of
an array-per-row, it is a interval-tree-per-row

I used two different interval tree libraries for testing hence iv1 and iv2

This layout method does not require any particular sorting, though sorting may
increase the density of the resulting layout

## Rendered images

I created rendered images of the resulting layouts in img folder, example

![](img/endarr.png)

## Benchmark output

#### Wide layout

```


==========================================
Benchmarking with 100,000 rectangles
==========================================
Benchmark 1: node src/bench/arrsimple.ts 100000
  Time (mean ± σ):     35.540 s ±  2.547 s    [User: 35.569 s, System: 0.179 s]
  Range (min … max):   32.841 s … 38.471 s    4 runs

Benchmark 2: node src/bench/endarr.ts 100000
  Time (mean ± σ):      4.025 s ±  0.040 s    [User: 3.893 s, System: 0.302 s]
  Range (min … max):    3.984 s …  4.074 s    4 runs

Benchmark 3: node src/bench/flatqueue.ts 100000
  Time (mean ± σ):      4.090 s ±  0.140 s    [User: 4.002 s, System: 0.251 s]
  Range (min … max):    3.912 s …  4.255 s    4 runs

Benchmark 4: node src/bench/gran.ts 100000
  Time (mean ± σ):     13.479 s ±  0.597 s    [User: 14.670 s, System: 1.190 s]
  Range (min … max):   12.661 s … 14.018 s    4 runs

Benchmark 5: node src/bench/gran_ultra.ts 100000
  Time (mean ± σ):      9.275 s ±  0.711 s    [User: 9.292 s, System: 0.190 s]
  Range (min … max):    8.514 s …  9.886 s    4 runs

Benchmark 6: node src/bench/iv1.ts 100000
  Time (mean ± σ):     43.322 s ±  2.552 s    [User: 43.991 s, System: 0.313 s]
  Range (min … max):   40.038 s … 45.642 s    4 runs

Summary
  node src/bench/endarr.ts 100000 ran
    1.02 ± 0.04 times faster than node src/bench/flatqueue.ts 100000
    2.30 ± 0.18 times faster than node src/bench/gran_ultra.ts 100000
    3.35 ± 0.15 times faster than node src/bench/gran.ts 100000
    8.83 ± 0.64 times faster than node src/bench/arrsimple.ts 100000
   10.76 ± 0.64 times faster than node src/bench/iv1.ts 100000

```

#### Tall layout

```




==========================================
Benchmarking TALL screen (5000x20000) with 50,000 rectangles
Testing: arrsimple_tall endarr_tall flatqueue_tall gran_tall gran_ultra_tall iv1_tall
==========================================
Benchmark 1: node src/bench/arrsimple_tall.ts
  Time (mean ± σ):      6.682 s ±  0.813 s    [User: 6.657 s, System: 0.177 s]
  Range (min … max):    6.113 s …  7.889 s    4 runs

Benchmark 2: node src/bench/endarr_tall.ts
  Time (mean ± σ):      4.516 s ±  0.474 s    [User: 4.399 s, System: 0.234 s]
  Range (min … max):    4.014 s …  5.060 s    4 runs

Benchmark 3: node src/bench/flatqueue_tall.ts
  Time (mean ± σ):      3.755 s ±  0.106 s    [User: 3.613 s, System: 0.269 s]
  Range (min … max):    3.673 s …  3.898 s    4 runs

Benchmark 4: node src/bench/gran_tall.ts
  Time (mean ± σ):     10.399 s ±  1.161 s    [User: 11.889 s, System: 0.523 s]
  Range (min … max):    9.065 s … 11.896 s    4 runs

Benchmark 5: node src/bench/gran_ultra_tall.ts
  Time (mean ± σ):      7.326 s ±  0.366 s    [User: 7.310 s, System: 0.169 s]
  Range (min … max):    7.028 s …  7.799 s    4 runs

Benchmark 6: node src/bench/iv1_tall.ts
  Time (mean ± σ):     17.797 s ±  3.601 s    [User: 17.958 s, System: 0.234 s]
  Range (min … max):   13.809 s … 21.969 s    4 runs

Summary
  node src/bench/flatqueue_tall.ts ran
    1.20 ± 0.13 times faster than node src/bench/endarr_tall.ts
    1.78 ± 0.22 times faster than node src/bench/arrsimple_tall.ts
    1.95 ± 0.11 times faster than node src/bench/gran_ultra_tall.ts
    2.77 ± 0.32 times faster than node src/bench/gran_tall.ts
    4.74 ± 0.97 times faster than node src/bench/iv1_tall.ts
```

## Next steps

- Experiment with freeing layout memory when no longer used. How this is done
  may vary based on the approach
- See if there are other references to algorithms like this from outside the
  bioinformatics-sphere (masonry layout in CSS?)
