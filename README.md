# Kale Graph [![GitHub Release](https://img.shields.io/github/v/release/olillin/kale-graph)](https://github.com/olillin/kale-graph/releases)

**Kale Graph** is an Obsidian plugin making it easy to visualize graphs (the
[Graph theory](https://en.wikipedia.org/wiki/Graph_theory) kind).

Getting started is as simple as installing the plugin and making a new [code
block](https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax#Code+blocks),
specifying `kale` as the language.

## `kale` language/format

Kale code blocks are parsed line by line. A line can specify [flags](#flags),
add [vertices](#vertices) or add [edges](#edges). A line cannot do multiple of
these at the same time.

### Flags

Kale code blocks can specify flags that change how the code block is
parsed/rendered. If the first line of a code block starts with a hyphen `-` any
letter on the rest of the line will be treated as a flag and apply changes as
specified below.

#### List of all flags

| Flag | Name     | Description                                                              |
| ---- | -------- | ------------------------------------------------------------------------ |
| `d`  | Directed | Makes the graph [directed](https://en.wikipedia.org/wiki/Directed_graph) |
| `s`  | Simple   | Removes repeated edges                                                   |
| `a`  | Auto     | Adds missing vertices that edges are connected to                        |

### Vertices

A vertex is specified simply by a name that identifies that vertex. Vertex
names may contain letters, digits and underscores (`_`). Multiple vertices can
be defined on a single line using the following syntax (spaces are optional):

```kale
vertex1, vertex2, vertex3
```

If a vertex is defined more than once the later occurences are ignored.

> [!TIP]  
> Any vertex that starts with an underscore (`_`) will be treated as an
> *invisible vertex*, meaning it is not rendered but still offsets other
> vertices. Useful for making subgraphs where you want the shaape to stay the
> same but not contain all vertices. Unlike normal vertices, invisible
> vertices names do not have to be unique.

### Edges

An edge is a connection between two [vertices](#vertices). An edge is specified
by two vertices surrounded by parenthesis `()` and seperated by a comma `,`. If
the **Directed** flag is active the edge will point from the first vertex to
the second.

```kale
a,b,c
(a,b), (b,c) // An edge from a to b, and one from b to c
```

#### Paths

Several edges in sequence can be specified as a [path](
https://en.wikipedia.org/wiki/Path_(graph_theory)), which is represented as
multiple vertices seperated by a connector `-`.

```kale
a,b,c,d,e,f
(a,b),(b,c),(c,d),(d,e),(e,f) // Long and tedious definition of every edge
a-b-c-d-e-f // Shorter path definition
```

Paths are also an easy way to define [cycles](
https://en.wikipedia.org/wiki/Cycle_(graph_theory)):

```kale
a,b,c
a-b-c-a // A cycle from a to a
```

### Comments

Any text after `//` will be treated as a comment and ignored when parsing a
code block.

## Settings

The appearance of Kale code blocks can be customized in the plugin's settings.
