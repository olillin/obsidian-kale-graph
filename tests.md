# Kale Graph Tests

## Vertices

### Layout

#### 1 vertex

```kale
a
```

#### 2 vertices

```kale
a,b
```

#### 3 vertices

```kale
a,b,c
```

#### 4 vertices

```kale
a,b,c,d
```

#### 5 vertices

```kale
a,b,c,d,e
```

#### 6 vertices

```kale
a,b,c,d,e,f
```

#### 7 vertices

```kale
a,b,c,d,e,f,g
```

### Invisible vertices

> Only *a* and *d* should be visible.

```kale
a,_b,_,d,_,_
```

## Edges

### Basic shapes

#### Triangle

```kale
a,b,c
(a,b),(b,c),(c,a)
```

#### Crossed square

```kale
a,b,c,d
(a,b),(b,c),(c,d),(d,a)
(a,c),(d,b)
```

### Paths

#### Triangle cycle

```kale
a,b,c
a-b-c-a
```

#### S-shape

```kale
a,b,c,d,e,f
b-a-f-c-d-e
```

### Bent

#### One way

> There should be 4 edges from *a* to *b*; 2 on bottom, 1 on top.

```kale
-d
a,b
(a,b),(a,b),(a,b),(a,b)
```

#### Triangle

> There should be 2 edges between *a* and *b* and 3 edges between *b* and *c*.

```kale
a,b,c
(c,b),(b,a)
(a,b),(b,c),(c,b)
```

#### Square

> There should be:
> 2 edges between *a* and *c*,
> 2 edges between *a* and *d*,
> and 4 edges between *b* and *d*.

```kale
a,b,c,d
(d,a),(a,d)
(b,d),(d,b),(b,d),(d,b)
(c,a),(a,c)
```

#### Outside

> All bent edges should be on the outside.

```kale
a,b,c
(a,b),(b,a)
(b,c),(c,b)
(c,a),(a,c)
```

#### Inside

> All bent edges should be on the inside.

```kale
a,b,c
(b,a),(a,b)
(c,b),(b,c)
(a,c),(c,a)
```

### Loops

#### 1 loop

```kale
a
a-a
```

#### 5 loops

```kale
a
a-a-a-a-a-a
```

### Adjacency Matrix

#### Undirected

> Should look like an N with 1 loop on *b* and 2 loops on *d*.

```kale
a,b,c,d
0 0 1 1
0 2 1 0
1 1 0 0
1 0 0 4
```

#### No spaces

> Should look identical to above.

```kale
a,b,c,d
0011
0210
1100
1004
```

#### 10+ connections

```kale
a,b
0 15
15 0
```

#### 1x1 matrix

> Should be 1 loop.

```kale
a
2
```

#### Directed

> Should look like an N with 2 loops on *b* and 1 loops on *d*. There should be an extra edge from *d* to *a* and from *c* to *b*.

```kale
-d
a,b,c,d
0 0 0 1
0 2 1 0
1 1 0 0
1 0 0 1
```

#### Invisible vertices

> Should have the same edges as above.

```kale
-d
_,a,_,b,c,d,_,_
0 0 0 1
0 2 1 0
1 1 0 0
1 0 0 1
```

## Flags

### Directed

#### Clockwise

```kale
-d
a,b,c
(a,b),(b,c),(c,a)
```

#### Counterclockwise

```kale
-d
a,b,c
(a,c),(c,b),(b,a)
```

#### Bent order

> Arrows should alternate between *a* to *b* and *b* to *a*, starting with *a* to *b*.

```kale
-d
a,b
(b,a),(a,b),(a,b),
(b,a),(b,a)
(a,b),(a,b)
```

### Simple

#### Triangle

> There should be no extra edges.

```kale
-s
a,b,c
a-b-c
c-b-a
b-a-c
a-b-c
```

### Auto

#### Pizza

```kale
-a
(a,b)
a-b-c-a
```

#### Flipped

> The arrows should be going counterclockwise.

```kale
-df
a,b,c
0 1 0
0 0 1
1 0 0
```

## Errors

### Undefined vertex

```kale
a
(a,b)
```

### Edge to invisible vertex

```kale
a,_
(a,_)
```

```kale
a,_b
a-_b
```

### Adjacency Matrix

#### Uneven rows

```kale
a,b,c
0101
00
10101
```

#### Too many columns

```kale
a,b,c
0000
0000
0000
```

#### Too few columns

```kale
a,b,c
00
00
00
```

#### Too many rows

```kale
a,b,c
000
000
000
000
000
000
```

#### Too few rows

```kale
a,b,c
000
000
```

#### Unsymmetrical

```kale
a,b,c
001
000
000
```

#### Odd loops in undirected graph

```kale
a,b,c,d
0 0 1 1
0 2 1 0
1 1 0 0
1 0 0 3
```
