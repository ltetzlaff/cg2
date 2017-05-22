import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import * as math from "mathjs"
import { Tree } from "./Trees/Tree"
import { IVisualizable } from "./Utils"
import { Grid } from "./Grid"
import { PointCloud } from "./PointCloud"
import { TreesUtils } from "./Trees/TreesUtils"


export class Surface implements IVisualizable {
  public visualization : BABYLON.Mesh
  public pointCloud : PointCloud

  private cubePrefab : BABYLON.Mesh

  constructor(tree : Tree, grid : Grid) {
    const points : BABYLON.Vector3[] = []

    const { findingPattern, k, radius, clamp, wendlandRadius, subdivisions, subdivideWithPolynomials } = grid.gridOptions
    
    const xCount = grid.xCount * subdivisions
    const zCount = grid.zCount * subdivisions
    const xResolution = grid.xResolution / subdivisions
    const zResolution = grid.zResolution / subdivisions

    const queryDelegate = (v2: BABYLON.Vector2) => {
      return tree.query(v2, findingPattern, { k, radius })
    }

    for (let gx = 0; gx <= xCount; gx++) {
      for (let gz = 0; gz <= zCount; gz++) {
        const gridPoint = new BABYLON.Vector3(
          grid.min.x + gx * xResolution,
          grid.min.y,
          grid.min.z + gz * zResolution)
        
        if (subdivideWithPolynomials || (gx % subdivisions === 0 && gz % subdivisions === 0)) {
          // calculate WLS Point
          const p = this.calculateWLSPoint(gridPoint, wendlandRadius, queryDelegate)
          if (p) {
            if (clamp) p.y = BABYLON.MathTools.Clamp(p.y, grid.min.y, grid.max.y)
            points.push(p)
          } else {
            points.push(gridPoint)
          } 
        } else {
          // interpolate using bezier surface (deCasteljau)

        }
      }
    }
    this.pointCloud = new PointCloud(points, "Surface")
  }

  calculateWLSPoint(gridPoint : BABYLON.Vector3, wendlandRadius : number, queryDelegate : (v2: BABYLON.Vector2) => TreesUtils.Point[]) {
    const {x, z} = gridPoint
    const nearbyPoints = queryDelegate(new BABYLON.Vector2(x, z))
    if (nearbyPoints.length <= 1) return null
    
    const dims = 6
    let m = math.zeros(dims, dims)
    let v = math.zeros(dims)
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
    return new BABYLON.Vector3(x, y, z)
  }

  destroy() {
    this.visualize(false, null, null)
  }

  visualize(show : boolean, material : BABYLON.Material, scene? : BABYLON.Scene) {
    this.pointCloud.visualize(show, material, scene)
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
