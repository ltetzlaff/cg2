import * as BABYLON from "../../node_modules/babylonjs/babylon.module"
import { TreesUtils } from "./TreesUtils"

export class KDTree implements TreesUtils.Tree {
  public children : any[]
  public points : TreesUtils.Point[]
  
  constructor(vertices : BABYLON.Vector3[], vertMeshes : BABYLON.InstancedMesh[], pointSize : BABYLON.Vector3= BABYLON.Vector3.Zero()) {
    this.children = []

    this.points = vertices.map((p, i) => {
      return new TreesUtils.Point(new TreesUtils.Box(p.subtract(pointSize.scale(.5)), pointSize), vertMeshes[i] || null)
    })
  }
  
  pick(ray : BABYLON.Ray, pattern : TreesUtils.FindingPattern, options : any) : TreesUtils.Point[] {
    return []
  }

  visualize(scene : BABYLON.Scene, container : BABYLON.Mesh[], mat : BABYLON.Material) : void {
  }

  findIntersecting(x : any) : any[] {
    return []
  }
}