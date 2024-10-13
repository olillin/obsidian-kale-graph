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
