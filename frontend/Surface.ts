import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import * as math from "mathjs"
import { Tree } from "./Trees/Tree"
import { IVisualizable } from "./Utils"
import { Grid, PointCloudToVertexData } from "./Grid"

export class Surface implements IVisualizable {
  public visualization : BABYLON.InstancedMesh[]

  private points : BABYLON.Vector3[]
  private cubePrefab : BABYLON.Mesh

  constructor(tree : Tree, grid : Grid) {
    this.points = []
    this.visualization = []

    const { findingPattern, k, radius, clamp, wendlandRadius, subdivisions } = grid.gridOptions
    
    const xCount = grid.xCount * subdivisions
    const xResolution = grid.xResolution / subdivisions
    const zCount = grid.zCount * subdivisions
    const zResolution = grid.zResolution / subdivisions

    for (let gx = 0; gx <= xCount; gx++) {
      for (let gz = 0; gz <= zCount; gz++) {
        const gridPoint = new BABYLON.Vector3(
          grid.min.x + gx * xResolution,
          grid.min.y,
          grid.min.z + gz * zResolution)

        const {x, z} = gridPoint
        const nearbyPoints = tree.query(new BABYLON.Vector2(x, z),
          findingPattern, { k, radius })

        const dims = 6
        let m = math.zeros(dims, dims)
        let v = math.zeros(dims)

        if (nearbyPoints.length <= 1) {
          // this would result in det(m) === 0 and therefore inv(m) breaks
          const defaultP = new BABYLON.Vector3(x, grid.min.y, z)
          this.points.push(defaultP)
          continue
        }

        nearbyPoints.forEach(nearbyBox => {
          const p = nearbyBox.box.center
          const weight = Surface.wendland(gridPoint, p, wendlandRadius)

          // add weighted systemMatrix
          m = math.add(m, math.multiply(Surface.Matrix(p.x, p.z), weight)) as number[][]
          v = math.add(v, math.multiply(Surface.Vector(p.x, p.z), p.y * weight)) as number[]
        })

        const vector = Surface.Vector(x, z)
        const coeffs = math.multiply(math.inv(m), v) as number[]
        const y = math.dot(vector, coeffs)
        if (clamp && (y < grid.min.y || y > grid.max.y)) {
          const clampedP = new BABYLON.Vector3(x, BABYLON.MathTools.Clamp(y, grid.min.y, grid.max.y), z)
          this.points.push(clampedP)
          continue
        }

        this.points.push(new BABYLON.Vector3(x, y, z))
      }
    }
  }

  destroy() {
    if (this.cubePrefab) this.cubePrefab.dispose()
    this.visualize(false, null, null)
  }

  buildMesh(grid : Grid, scene : BABYLON.Scene) {
    //this.clearPointMeshes()
    const vd = PointCloudToVertexData(grid, this.points)
    const mesh = new SurfaceMesh("reconstructed surface", scene)
    vd.applyToMesh(mesh)
    return mesh
  }

  visualize(show : boolean, scene : BABYLON.Scene, material : BABYLON.Material) {
    if (!show) {
      this.visualization.forEach(m => m.dispose())
      this.visualization = []
      return
    }

    if (!this.cubePrefab) {
      this.cubePrefab = BABYLON.MeshBuilder.CreateBox("", { size: .005 }, scene)
      this.cubePrefab.isVisible = false
      this.cubePrefab.material = material
    }

    this.points.forEach(p => {
      const c = this.cubePrefab.createInstance("point")
      c.setAbsolutePosition(p)
      this.visualization.push(c)
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

export class SurfaceMesh extends BABYLON.Mesh implements IVisualizable {
  public visualization : BABYLON.Mesh

  public visualize(show : boolean, _scene : BABYLON.Scene, material : BABYLON.Material) {
    this.isVisible = show
    
    if (!show) {
      return
    }

    this.convertToFlatShadedMesh()    
    this.material = material
  }

  public destroy() {
    this.dispose()
  }
}
