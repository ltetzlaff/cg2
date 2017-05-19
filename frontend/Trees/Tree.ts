import * as BABYLON from "../../node_modules/babylonjs/babylon.module"
import { TreesUtils } from "./TreesUtils"

export interface Tree {
  children : any[]
  points : TreesUtils.Point[]

  pick(ray : BABYLON.Ray, pattern : TreesUtils.FindingPattern, options : any) : TreesUtils.Point[]

  query(startingPoint : BABYLON.Vector3 | BABYLON.Vector2, pattern : TreesUtils.FindingPattern, options : any) : TreesUtils.Point[]
}