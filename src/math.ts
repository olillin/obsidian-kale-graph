export function vertexPairKey(a: number, b: number) {
    return a + b + 2 * a * b
}

// https://www.geeksforgeeks.org/equation-of-circle-when-three-points-on-the-circle-are-given/
/**
 * Find the circle on which the given three points lie.
 * Returns [centerX, centerY, radius]
 */
export function findCircle(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number
): [number, number, number] {
    const x12 = x1 - x2
    const x13 = x1 - x3

    const y12 = y1 - y2
    const y13 = y1 - y3

    const y31 = y3 - y1
    const y21 = y2 - y1

    const x31 = x3 - x1
    const x21 = x2 - x1

    //x1^2 - x3^2
    const sx13 = Math.pow(x1, 2) - Math.pow(x3, 2)

    // y1^2 - y3^2
    const sy13 = Math.pow(y1, 2) - Math.pow(y3, 2)

    const sx21 = Math.pow(x2, 2) - Math.pow(x1, 2)
    const sy21 = Math.pow(y2, 2) - Math.pow(y1, 2)

    const f =
        (sx13 * x12 + sy13 * x12 + sx21 * x13 + sy21 * x13) /
        (2 * (y31 * x12 - y21 * x13))
    const g =
        (sx13 * y12 + sy13 * y12 + sx21 * y13 + sy21 * y13) /
        (2 * (x31 * y12 - x21 * y13))

    const c = -Math.pow(x1, 2) - Math.pow(y1, 2) - 2 * g * x1 - 2 * f * y1

    // eqn of circle be
    // x^2 + y^2 + 2*g*x + 2*f*y + c = 0
    // where centre is (h = -g, k = -f) and radius r
    // as r^2 = h^2 + k^2 - c
    const h = -g
    const k = -f
    const sqr_of_r = h * h + k * k - c

    // r is the radius
    const r = Math.sqrt(sqr_of_r)

    return [h, k, r]
}
