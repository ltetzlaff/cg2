import { Vector3, Vector2, Ray } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { TreesUtils, Vertex } from "./TreesUtils"

export interface Tree {
  children : any[]
  points : Vertex[]

  pick(ray : Ray, pattern : TreesUtils.FindingPattern, options : any) : Vertex[]

  query(startingPoint : Vector3 | Vector2, pattern : TreesUtils.FindingPattern, options : any) : Vertex[]
}