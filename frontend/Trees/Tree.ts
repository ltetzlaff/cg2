import * as BABYLON from "../../node_modules/babylonjs/babylon.module"
import { TreesUtils } from "./TreesUtils"

export interface Tree {
  children : any[]
  points : BABYLON.Vector3[]

  pick(ray : BABYLON.Ray, pattern : TreesUtils.FindingPattern, options : any) : BABYLON.Vector3[]

  query(startingPoint : BABYLON.Vector3 | BABYLON.Vector2, pattern : TreesUtils.FindingPattern, options : any) : BABYLON.Vector3[]
}