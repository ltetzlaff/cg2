import * as BABYLON from "../../node_modules/babylonjs/babylon.module"
import { PointCloud } from "./PointCloud"
import { Grid3D } from "./Grid3D"
import { TreesUtils } from "../Trees/TreesUtils"

export class ImplicitSamples extends PointCloud {
  constructor(source : PointCloud, grid : Grid3D) {
    const isNearest = (p : BABYLON.Vector3, p2 : BABYLON.Vector3) => {
      const picked = source.tree.query(p2, TreesUtils.FindingPattern.KNearest, { k : 1 })
      return picked.length === 1 && picked[0].equals(p) 
    }

    const vertices = source.vertices
    const normals = source.normals    
    const points : BABYLON.Vector3[] = []
    let epsilon0 = BABYLON.Vector3.Distance(grid.min, grid.max) * .01 * 2
    console.log(epsilon0)
    vertices.forEach((p, i) => {
      // original point p_i
      points.push(p)

      let epsilon = epsilon0

      // outward point p_i + n_i
      let pOut
      do {
        epsilon *= .5
        pOut = p.add(normals[i].scale(epsilon))
      } while (!isNearest(p, pOut))
      points.push(pOut)

      epsilon = epsilon0

      // inward point p_i + n_i
      let pIn
      do {
        epsilon *= .5
        pIn = p.subtract(normals[i].scale(epsilon))
      } while (!isNearest(p, pIn))
      points.push(pIn)
    })
    
    super(points, "Implicit Surface")
  }
}