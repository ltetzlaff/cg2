import * as BABYLON from "../../node_modules/babylonjs/babylon.module"
import * as math from "mathjs"
import { Tree } from "../Trees/Tree"
import { IVisualizable } from "../Utils"
import { Grid3D } from "./Grid3D"
import { PointCloud } from "./PointCloud"
import { TreesUtils } from "../Trees/TreesUtils"
import { solveDeCasteljau, calculateWLSPoint } from "./SurfaceUtils"

export class Surface implements IVisualizable {
  public visualization : BABYLON.Mesh
  public pointCloud : PointCloud

  private cubePrefab : BABYLON.Mesh

  constructor(tree : Tree, grid : Grid3D) {
    const points : BABYLON.Vector3[] = []
    const normals : BABYLON.Vector3[] = []

    const { findingPattern, k, radius, clamp, wendlandRadius, subdivisions, subdivideWithPolynomials } = grid.gridOptions
    
    const { resolution } = grid

    const queryDelegate = (v2: BABYLON.Vector2) => {
      return tree.query(v2, findingPattern, { k, radius })
    }

    const defaultNormal = new BABYLON.Vector3(1, 1, 1)
    const interpolatePoints : BABYLON.Vector3[] = []

    for (let gx = 0; gx <= subdivisions; gx++) {
      for (let gz = 0; gz <= subdivisions; gz++) {
        const gridPoint = new BABYLON.Vector3(
          grid.min.x + gx * resolution.x,
          grid.min.y,
          grid.min.z + gz * resolution.z)
        
        const isOnGrid = gx % subdivisions === 0 && gz % subdivisions === 0
        
        if (!(isOnGrid && subdivideWithPolynomials)) {
          interpolatePoints.push(gridPoint)
        }

        if (isOnGrid || subdivideWithPolynomials) {
          // calculate WLS Point
          const { point, normal } = calculateWLSPoint(gridPoint, wendlandRadius, queryDelegate)
          if (clamp) point.y = BABYLON.MathTools.Clamp(point.y, grid.min.y, grid.max.y)
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

  visualize(show : boolean, material : BABYLON.Material, scene? : BABYLON.Scene) {
    this.pointCloud.visualize(show, material, scene)
  }
}
