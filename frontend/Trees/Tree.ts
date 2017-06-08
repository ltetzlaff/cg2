import { Vector3, Vector2, Ray } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { TreesUtils } from "./TreesUtils"

export interface Tree {
  children : any[]
  points : Vector3[]

  pick(ray : Ray, pattern : TreesUtils.FindingPattern, options : any) : Vector3[]

  query(startingPoint : Vector3 | Vector2, pattern : TreesUtils.FindingPattern, options : any) : Vector3[] | number[]
}