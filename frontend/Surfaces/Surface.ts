import { Vector3, Vector2, Mesh, MathTools, Scene, Material } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import * as math from "mathjs"
import { Tree } from "../Trees/Tree"
import { IVisualizable } from "../Utils"
import { Grid3D } from "./Grid3D"
import { PointCloud } from "./PointCloud"
import { TreesUtils } from "../Trees/TreesUtils"
import { solveDeCasteljau, calculateWLSPoint } from "./SurfaceUtils"
import { PolynomialBasis } from "./PolynomialBasis"

export class Surface implements IVisualizable {
  public visualization : Mesh
  public pointCloud : PointCloud

  private cubePrefab : Mesh

  constructor(tree : Tree, grid : Grid3D) {
    const points : Vector3[] = []
    const normals : Vector3[] = []

    const { findingPattern, k, radius, clamp, wendlandRadius, subdivisions, subdivideWithPolynomials } = grid.gridOptions
    
    const { resolution } = grid

    const queryDelegate = (v2: Vector2) => {
      return tree.query(v2, findingPattern, { k, radius }) as Vector3[]
    }

    const defaultNormal = new Vector3(1, 1, 1)
    const interpolatePoints : Vector3[] = []

    for (let gx = 0; gx <= subdivisions; gx++) {
      for (let gz = 0; gz <= subdivisions; gz++) {
        const gridPoint = new Vector3(
          grid.min.x + gx * resolution.x,
          grid.min.y,
          grid.min.z + gz * resolution.z)
        
        const isOnGrid = gx % subdivisions === 0 && gz % subdivisions === 0
        
        if (!(isOnGrid && subdivideWithPolynomials)) {
          interpolatePoints.push(gridPoint)
        }

        if (isOnGrid || subdivideWithPolynomials) {
          // calculate WLS Point
          const { point, normal } = calculateWLSPoint(gridPoint, wendlandRadius, queryDelegate, PolynomialBasis.Quadratic(2))
          if (clamp) point.y = MathTools.Clamp(point.y, grid.min.y, grid.max.y)
          points.push(point)
          normals.push(normal)
        }
      }
    }

    if (subdivideWithPolynomials) {
      this.pointCloud = new PointCloud(points, "Surface")
      this.pointCloud.normals = normals
    } else {
      const tensor = solveDeCasteljau(interpolatePoints, points, subdivisions)
      this.pointCloud = new PointCloud(tensor.points, "BTP Surface")
      this.pointCloud.normals = tensor.normals
    }
  }

  destroy() {
    this.visualize(false, null, null)
  }

  visualize(show : boolean, material : Material, scene? : Scene) {
    this.pointCloud.visualize(show, material, scene)
  }
}
