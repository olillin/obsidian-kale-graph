import { cancelParse } from "./errors"
import { Flags, GraphData, Vertex } from "./types"

export function parseFlags(line: string): Partial<Flags> {
    const flags: Partial<Flags> = {}

    if (line.contains("d")) flags.directed = true
    if (line.contains("s")) flags.simple = true
    if (line.contains("a")) flags.auto = true
    if (line.contains("f")) flags.flipped = true

    return flags
}

export const DEFAULT_FLAGS: Flags = {
    directed: false,
    simple: false,
    auto: false,
    flipped: false,
}

export const COMMENT_PATTERN = /\/\/.+/
export const FLAG_PREFIX = "-"

export const EDGE_VALIDATE_PATTERN =
    /^(\(\s*(\w+?\s*[,]\s*\w+?)\s*\)(\s*[,]\s*)?)+$/
export const EDGE_SEARCH_PATTERN = /\(\s*(\w+?)\s*[,]\s*(\w+?)\s*\)/g

export const ADJACENCY_MATRIX_VALIDATE_PATTERN = /^[\s\d]+$/
export const ADJACENCY_MATRIX_SEARCH_PATTERN = /\d+/g

export const PATH_VALIDATE_PATTERN = /^(\w+\s*-\s*)*\w+\s*$/
export const PATH_SEARCH_PATTERN = /\w+(?=\s*(-|$))/g

export const VERTEX_VALIDATE_PATTERN = /^(\w+\s*,\s*)*\w+\s*,?$/
export const VERTEX_SEARCH_PATTERN = /\w+(?=\s*(,|$))/g

export const INVISIBLE_VERTEX_PREFIX = "_"

export function parseSource(source: string): GraphData {
    const lines = source
        .split("\n")
        .map(line => line.replace(COMMENT_PATTERN, "").trim())
        .filter(line => line.length > 0)

    const flags: Flags = Object.assign({}, DEFAULT_FLAGS)
    const vertices: Array<Vertex> = new Array()
    const edges: Array<number> = []

    let firstLine = true
    let matrix: Array<Array<number>> = []
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        if (
            matrix.length > 0 &&
            !ADJACENCY_MATRIX_VALIDATE_PATTERN.test(line)
        ) {
            cancelParse(
                "An adjacency matrix cannot be combined with other edge definitions"
            )
        }

        if (firstLine && line.startsWith(FLAG_PREFIX)) {
            // Flags
            Object.assign(flags, parseFlags(line.slice(FLAG_PREFIX.length)))
        } else if (EDGE_VALIDATE_PATTERN.test(line)) {
            // Edges
            for (let match of line.matchAll(EDGE_SEARCH_PATTERN)) {
                let fromIndex = vertices.indexOf(match[1])
                if (fromIndex === -1) {
                    if (flags.auto) {
                        vertices.push(match[1])
                        fromIndex = vertices.length - 1
                    } else {
                        cancelParse(`Undefined vertex in edge on line ${i + 1}`)
                    }
                }
                let toIndex = vertices.indexOf(match[2])
                if (toIndex === -1) {
                    if (flags.auto) {
                        vertices.push(match[2])
                        toIndex = vertices.length - 1
                    } else {
                        cancelParse(`Undefined vertex in edge on line ${i + 1}`)
                    }
                }

                edges.push(fromIndex, toIndex)
            }
        } else if (ADJACENCY_MATRIX_VALIDATE_PATTERN.test(line)) {
            if (edges.length > 0) {
                cancelParse("An adjacency matrix follow other edge definitions")
            }

            const matches = [...line.matchAll(ADJACENCY_MATRIX_SEARCH_PATTERN)]
            let row: Array<number>
            if (matches.length == 1) {
                row = matches[0][0].split("").map(x => parseInt(x))
            } else {
                row = matches.map(x => parseInt(x[0]))
            }
            if (matrix.length > 0 && row.length !== matrix[0].length) {
                cancelParse("Matrix rows must be of equal width")
            }
            matrix.push(row)
        } else if (VERTEX_VALIDATE_PATTERN.test(line)) {
            // Vertices
            for (let match of line.matchAll(VERTEX_SEARCH_PATTERN)) {
                let vertex: Vertex = match[0]
                vertices.push(vertex)
            }
        } else if (PATH_VALIDATE_PATTERN.test(line)) {
            // Paths
            let lastVertexIndex: number = -1
            for (let match of line.matchAll(PATH_SEARCH_PATTERN)) {
                const vertex: Vertex = match[0]
                let vertexIndex = vertices.indexOf(vertex)
                if (vertexIndex === -1) {
                    if (flags.auto) {
                        vertices.push(vertex)
                        vertexIndex = vertices.length - 1
                    } else {
                        cancelParse(`Undefined vertex in path on line ${i + 1}`)
                    }
                }
                if (lastVertexIndex !== -1) {
                    edges.push(lastVertexIndex, vertexIndex)
                }
                lastVertexIndex = vertexIndex
            }
        } else {
            cancelParse(`Invalid input on line ${i + 1}`)
        }
        firstLine = false
    }

    const visibleVertices: Vertex[] = []
    const vertexOffsets: number[] = []
    let offset = 0
    for (const vertex of vertices) {
        if (vertex.startsWith(INVISIBLE_VERTEX_PREFIX)) {
            offset++
        } else {
            visibleVertices.push(this)
            vertexOffsets.push(offset)
        }
    }
    if (matrix.length > 0) {
        if (matrix.length !== visibleVertices.length) {
            cancelParse("Matrix height must match number of vertices")
        }
        if (matrix[0].length !== visibleVertices.length) {
            cancelParse("Matrix width must match number of vertices")
        }

        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix.length; j++) {
                if (!flags.directed && j > i) {
                    continue
                }
                let value = flags.flipped ? matrix[j][i] : matrix[i][j]

                if (!flags.directed) {
                    const oppositeValue = flags.flipped
                        ? matrix[i][j]
                        : matrix[j][i]

                    if (value !== oppositeValue) {
                        cancelParse(
                            "Adjacency matrix of an undirected graph must be symmetrical"
                        )
                    }
                    if (i == j) {
                        if (value % 2 !== 0) {
                            cancelParse(
                                "All vertices in an adjacency matrix of an undirected graph must connect to itself an even amount of times"
                            )
                        }
                        value /= 2
                    }
                }
                for (let k = 0; k < value; k++) {
                    edges.push(i + vertexOffsets[i], j + vertexOffsets[j])
                }
            }
        }
    }

    return { flags, vertices, edges }
}
