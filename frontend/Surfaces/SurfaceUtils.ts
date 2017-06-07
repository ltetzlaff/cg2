import * as BABYLON from "../../node_modules/babylonjs/babylon.module"

export function solveDeCasteljau(interpolatePoints : BABYLON.Vector3[], controlPoints : BABYLON.Vector3[], subdivisions : number) {
  const f = (n : number) => math.factorial(n) as number
  const binomial = (n : number, k : number) => f(n)/(f(k) * f(n - k))
  const b = (n : number, i : number, u : number) => {
    if (n === 0 && i === 0) return 1
    if (i > n) return 0
    
    return binomial(n, i) * Math.pow(u, i) * Math.pow(1 - u, n - i)
  }
  
  const points : BABYLON.Vector3[] = []
  const normals : BABYLON.Vector3[] = []
  interpolatePoints.forEach(point => {
    const { x : u, z : v } = point
    let y = 0

    const m = subdivisions
    const n = subdivisions
    for (let i = 0; i <= m; i++) {
      const Bmi = b(m, i, u)
      for (let j = 0; j <= n; j++) {
        const Bnj = b(n, j, v)
        const bij = controlPoints[i * (subdivisions + 1) + j]
        y += bij.y * Bmi * Bnj
      }
    }
    
    point.y = y
    points.push(point)

    // #TODO!
    const yt1 = 0
    const yt2 = 0
    
    const t1 = new BABYLON.Vector3(0, yt1, 1)
    const t2 = new BABYLON.Vector3(1, yt2, 0)
    const normal = BABYLON.Vector3.Cross(t1, t2)
    normals.push(normal)
  })    
  return { points, normals }
}

export function wendland(a : BABYLON.Vector3, b : BABYLON.Vector3, radius : number) {
  const dist = BABYLON.Vector3.DistanceSquared(a, b)
  const dh = dist / radius
  return Math.pow(1 - dh, 4) * (4 * dh + 1)
}

export function calculateWLSPoint(gridPoint : BABYLON.Vector3, wendlandRadius : number, queryDelegate : (v2: BABYLON.Vector2) => BABYLON.Vector3[]) {
  const {x, z} = gridPoint
  const nearbyPoints = queryDelegate(new BABYLON.Vector2(x, z))
  if (nearbyPoints.length <= 1) return null
  
  const dims = 6
  let m = math.zeros(dims, dims)
  let v = math.zeros(dims)
  nearbyPoints.forEach(p => {
    const weight = wendland(gridPoint, p, wendlandRadius)

    // add weighted systemMatrix
    m = math.add(m, math.multiply(Matrix(p.x, p.z), weight)) as number[][]
    v = math.add(v, math.multiply(Vector(p.x, p.z), p.y * weight)) as number[]
  })

  const vector = Vector(x, z)
  const coeffs = math.multiply(math.inv(m), v)
  const y = math.dot(vector, coeffs as number[])
  
  // Calculate Normal based on perpendicular tangents
  // tangent'y is coeffs derived by u or v
  const c = (i : number) => (coeffs as mathjs.Matrix).get([i])
  const t1 = new BABYLON.Vector3(1, c(1) + 2 * c(3) * x + c(4) * z, 0)
  const t2 = new BABYLON.Vector3(0, c(2) + 2 * c(5) * z + c(4) * x , 1)
  const normal = BABYLON.Vector3.Cross(t1, t2)
    .normalize()
    .scaleInPlace(-1)

  return { point : new BABYLON.Vector3(x, y, z) , normal }
}

function Vector(u : number, v : number) {
  return [1, u, v, u * u, u * v, v * v]
}

function Matrix(u : number, v : number) {
  const uv = u * v
  const u2 = u * u
  const u2v = u2 * v
  const u3 = u2 * u
  const u3v = u3 * v
  const v2 = v * v
  const v2u = v2 * u
  const v3 = v2 * v
  const v3u = v3 * u
  const v3v = v3 * v
  const u2v2 = u2 * v2

  return [
    [1    , u     , v     , u2    , uv    , v2    ],
    [u    , u2    , uv    , u3    , u2v   , v2u   ],
    [v    , uv    , v2    , u2v   , v2u   , v3    ],
    [u2   , u3    , u2v   , u3*u  , u3v   , u2v2  ],
    [uv   , u2v   , v2u   , u3v   , u2v2  , v3u   ],
    [v2   , v2u   , v3    , u2v2  , v3u   , v3v   ]
  ]
}