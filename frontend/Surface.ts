import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import { TreesUtils } from "./Trees/TreesUtils"
import { Tree } from "./Trees/Tree"
import * as math from "mathjs"

export enum Level {
  Min, Max, Average
}

export class GridOptions {
  public resolution : number
  public subdivisions : number

  public findingPattern : TreesUtils.FindingPattern
  public radius : number
  public k : number

  public wendlandRadius : number
  public yLevel : Level
  public clamp : boolean

  constructor() {
    this.resolution = 1
    this.subdivisions = 1

    this.radius = .1
    this.k = 1

    this.wendlandRadius = .2
    this.yLevel = Level.Min
    this.clamp = false
  }
}

export class Grid {
  public gridOptions : GridOptions
  public min : BABYLON.Vector3
  public max : BABYLON.Vector3
  public xCount : number
  public zCount : number
  public xResolution : number
  public zResolution : number
  private yAverage : number
  private plane : BABYLON.Mesh
  public yPosition : number

  constructor(min : BABYLON.Vector3, max : BABYLON.Vector3, gridOptions : GridOptions) {
    this.gridOptions = gridOptions
    this.min = min
    this.max = max

    const diff = max.subtract(min)
    this.xCount = Math.floor(diff.x/gridOptions.resolution)
    this.xResolution = diff.x/this.xCount

    this.zCount = Math.floor(diff.z/gridOptions.resolution)
    this.zResolution = diff.z/this.zCount

    this.yAverage = min.y + diff.y/2
    this.yPosition = this.getYPosition()
  }

  getYPosition() : number {
    switch (this.gridOptions.yLevel) {
      case Level.Min: return this.min.y
      case Level.Max: return this.max.y
      case Level.Average: return this.yAverage
      default: throw new RangeError()
    }
  }

  visualize(scene : BABYLON.Scene, material : BABYLON.Material) {
    const plane = BABYLON.MeshBuilder.CreateTiledGround("grid", {
      xmin: this.min.x, xmax: this.max.x,
      zmin: this.min.z, zmax: this.max.z,
      subdivisions: { w: this.xCount, h: this.zCount }
    }, scene)
    plane.position.y = this.yPosition
    plane.material = material
    this.plane = plane
  }

  destroy() {
    if (this.plane) this.plane.dispose()
  }
}

export class Surface {
  private mesh : BABYLON.Mesh
  private points : BABYLON.Vector3[]
  private pointMeshes : BABYLON.InstancedMesh[]
  private cubePrefab : BABYLON.Mesh

  constructor(tree : Tree, grid : Grid) {
    console.time("-- built Surface in:")
    this.points = []
    this.pointMeshes = []
    for (let gx = 0; gx < grid.xCount; gx++) {
      for (let gz = 0; gz < grid.zCount; gz++) {
        const gridPoint = new BABYLON.Vector3(
          grid.min.x + gx * grid.xResolution,
          grid.yPosition,
          grid.min.z + gz * grid.zResolution)
        const { findingPattern, k, radius, clamp } = grid.gridOptions
        const nearbyPoints = tree.query(gridPoint, findingPattern,
          { k, radius })

        const dims = 6
        let m = math.zeros(dims, dims)
        let v = math.zeros(dims)

        if (nearbyPoints.length <= 1) continue // this would result in det(m) === 0 and therefore inv(m) breaks

        nearbyPoints.forEach(nearbyBox => {
          const p = nearbyBox.box.center
          const weight = Surface.wendland(gridPoint, p, grid.gridOptions.wendlandRadius)

          // add weighted systemMatrix
          m = math.add(m, math.multiply(Surface.Matrix(p.x, p.z), weight)) as number[][]
          v = math.add(v, math.multiply(Surface.Vector(p.x, p.z), p.y * weight)) as number[]
        })

        const {x, z} = gridPoint
        const vector = Surface.Vector(x, z)
        const coeffs = math.multiply(math.inv(m), v) as number[]
        const y = math.dot(vector, coeffs)
        if (clamp && (y < grid.min.y || y > grid.max.y)) continue
        this.points.push(new BABYLON.Vector3(x, y, z))
      }
    }
    console.timeEnd("-- built Surface in:")
  }

  destroy() {
    if (this.mesh) this.mesh.dispose()
    if (this.cubePrefab) this.cubePrefab.dispose()
    this.pointMeshes.forEach(m => m.dispose())
  }

  visualize(scene : BABYLON.Scene, material : BABYLON.Material) {
    if (this.cubePrefab) this.cubePrefab.dispose()
    this.pointMeshes.forEach(m => m.dispose())

    this.cubePrefab = BABYLON.MeshBuilder.CreateBox("", {
      size: .01
    }, scene)
    this.cubePrefab.isVisible = false
    this.cubePrefab.material = material

    this.points.forEach(p => {
      const c = this.cubePrefab.createInstance("point")
      c.setAbsolutePosition(p)
      this.pointMeshes.push(c)
    })
  }

  static wendland(a : BABYLON.Vector3, b : BABYLON.Vector3, radius : number) {
    const dist = BABYLON.Vector3.DistanceSquared(a, b)
    const dh = dist / radius
    return Math.pow(1 - dh, 4) * (4 * dh + 1)
  }

  static Vector(u : number, v : number) {
    return [1, u, v, u * u, u * v, v * v]
  }

  static Matrix(u : number, v : number) {
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
      /*[1    , u     , v     , u2    , u*v   , v2    ],
      [u    , u*u   , u*v   , u3    , u2*v  , v2*u  ],
      [v    ,   0   ,   0   ,   0   ,   0   ,   0   ],
      [u*u  ,   0   ,   0   ,   0   ,   0   ,   0   ],
      [u*v  ,   0   ,   0   ,   0   ,   0   ,   0   ],
      [v2   , v2*u  , v3    , v2*u2 , v3*u  , v3*v  ]*/
      [1    , u     , v     , u2    , uv    , v2    ],
      [u    , u2    , uv    , u3    , u2v   , v2u   ],
      [v    , uv    , v2    , u2v   , v2u   , v3    ],
      [u2   , u3    , u2v   , u3*u  , u3v   , u2v2  ],
      [uv   , u2v   , v2u   , u3v   , u2v2  , v3u   ],
      [v2   , v2u   , v3    , u2v2  , v3u   , v3v   ]
    ]
  }
}


