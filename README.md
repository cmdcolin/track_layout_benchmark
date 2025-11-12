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
Claude Code make some optimizations to it

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

### Bitset

This is similar to the granular rect layout, but uses a "bitset"
(https://www.npmjs.com/package/bitset) instead of a basic array

This layout method does not require any particular sorting, though sorting may
increase the density of the resulting layout

## Rendered images

I created rendered images of the resulting layouts in img folder, example

![](img/endarr.png)

## Next steps

- Experiment with freeing layout memory when no longer used. How this is done
  may vary based on the approach
- See if there are other references to algorithms like this from outside the
  bioinformatics-sphere (masonry layout in CSS?)
