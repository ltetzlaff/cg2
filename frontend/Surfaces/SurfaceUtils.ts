import { Vector3, Vector2 } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import * as math from "mathjs"
import { Tree } from "../Trees/Tree"
import { TreesUtils } from "../Trees/TreesUtils"
import { PolynomialBasis } from "./PolynomialBasis"

export function solveDeCasteljau(interpolatePoints : Vector3[], controlPoints : Vector3[], subdivisions : number) {
  const f = (n : number) => math.factorial(n) as number
  const binomial = (n : number, k : number) => f(n)/(f(k) * f(n - k))
  const b = (n : number, i : number, u : number) => {
    if (n === 0 && i === 0) return 1
    if (i > n) return 0
    
    return binomial(n, i) * Math.pow(u, i) * Math.pow(1 - u, n - i)
  }
  
  const points : Vector3[] = []
  const normals : Vector3[] = []
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
    
    const t1 = new Vector3(0, yt1, 1)
    const t2 = new Vector3(1, yt2, 0)
    const normal = Vector3.Cross(t1, t2)
    normals.push(normal)
  })    
  return { points, normals }
}

export function wendland(a : Vector3, b : Vector3, radius : number) {
  const dist = Vector3.Distance(a, b)
  const dh = dist / radius
  return Math.pow(1 - dh, 4) * (4 * dh + 1)
}

export function calculateMLSPoint(
  gridPoint : Vector3,
  radius : number,
  tree : Tree,
  basis : PolynomialBasis,
  arrays : Vector3[][],
  epsilon : number) {
  const { x, y, z } = gridPoint
  
  const options = { k: basis.length, radius, justIndices : true }
  const query = (fp : TreesUtils.FindingPattern) => tree.query(gridPoint, fp, options) as number[]

  let nearbyPoints : number[]
  nearbyPoints = query(TreesUtils.FindingPattern.Radius)

  if (nearbyPoints.length === 0) {
    return Number.MAX_VALUE  
  }

  if (nearbyPoints.length < basis.length) {
    nearbyPoints = query(TreesUtils.FindingPattern.KNearest)
  }
  if (nearbyPoints.length < basis.length) {
    throw new RangeError("KNearest Picking didnt return (" + basis.length + ") points")
  }

  const maxDistance = Vector3.Distance(gridPoint, arrays[1][nearbyPoints[nearbyPoints.length - 1]])

  const d = basis.length
  let m = math.zeros(d, d)
  let v = math.zeros(d)

  const implicitFactors = [-epsilon, 0, epsilon]
  for (let j = 0; j < arrays.length; j++) {
    const points = arrays[j]
    const implicitWeight = implicitFactors[j]
    
    nearbyPoints.forEach(i => {
      const p = points[i]
      const weight = wendland(gridPoint, p, maxDistance)

      // add weighted systemMatrix
      m = math.add(m, math.multiply(basis.matrix(p), weight)) as number[][]
      v = math.add(v, math.multiply(basis.vector(p), weight * implicitWeight)) as number[]
    })
  }

  const coeffs = math.multiply(math.inv(m), v)
  const f = math.dot(basis.vector(gridPoint), coeffs as number[])
  return f
}

export function calculateWLSPoint(
  gridPoint : Vector3, 
  wendlandRadius : number, 
  queryDelegate : (v2: Vector2) => Vector3[],
  basis : PolynomialBasis) {
  const {x, z} = gridPoint
  const nearbyPoints = queryDelegate(new Vector2(x, z))
  if (nearbyPoints.length <= 1) return null
  
  const d = basis.length
  let m = math.zeros(d, d)
  let v = math.zeros(d)
  nearbyPoints.forEach(point => {
    const p = new Vector2(point.x, point.z)
    const f = point.y

    const weight = wendland(gridPoint, point, wendlandRadius)

    // add weighted systemMatrix
    m = math.add(m, math.multiply(basis.matrix(p), weight)) as number[][]
    v = math.add(v, math.multiply(basis.vector(p), weight * f)) as number[]
  })

  const coeffs = math.multiply(math.inv(m), v)
  const y = math.dot(basis.vector(new Vector2(x, z)), coeffs as number[])
  
  // Calculate Normal based on perpendicular tangents
  // tangent'y is coeffs derived by u or v
  const c = (i : number) => (coeffs as mathjs.Matrix).get([i])
  const t1 = new Vector3(1, c(1) + 2 * c(3) * x + c(4) * z, 0)
  const t2 = new Vector3(0, c(2) + 2 * c(5) * z + c(4) * x , 1)
  const normal = Vector3.Cross(t1, t2)
    .normalize()
    .scaleInPlace(-1)

  return { point : new Vector3(x, y, z) , normal }
}