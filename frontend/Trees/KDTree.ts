import * as BABYLON from "../../node_modules/babylonjs/babylon.module"
import { TreesUtils } from "./TreesUtils"

export class KDTree implements TreesUtils.Tree {
  public children : any[]
  
  constructor(poins : BABYLON.Vector3[]) {
    this.children = []
  }
  
  pick(ray : BABYLON.Ray, pattern : TreesUtils.FindingPattern, options : any) : TreesUtils.Box[] {
    return []
  }

  visualize(scene : BABYLON.Scene, container : BABYLON.Mesh[], mat : BABYLON.Material) : void {

  }
}