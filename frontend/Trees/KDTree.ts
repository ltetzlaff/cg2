import { TreesUtils } from "./TreesUtils"

export class KDTree implements TreesUtils.Tree {
  constructor(poins : BABYLON.Vector3[]) {
    
  }
  
  pick(ray : BABYLON.Ray, pattern : TreesUtils.FindingPattern, options : any) : BABYLON.Vector3[] {
    return []
  }
}