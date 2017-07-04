import { Vector3, Vector2, Ray } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { Vertex } from "../Geometry/Vertex"
import { FindingPattern } from "../Utils"
import { Sphere, Tube } from "./BoundingVolumes"

export interface IQueryable{
  findIntersecting(ray : Ray) : any
  findIntersecting(sphere : Sphere) : any
  findIntersecting(tube : Tube) : any
}

export interface Tree {
  children : any[]
  points : Vertex[]

  pick(ray : Ray, pattern : FindingPattern, options : any) : Vertex[]

  query(startingPoint : Vector3 | Vector2, pattern : FindingPattern, options : any) : Vertex[]
}