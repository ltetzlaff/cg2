import { Vector3 } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { HalfEdge } from "./HalfEdge"

export class Vertex {
  public position : Vector3
  public normal : Vector3
  public index : number
  public halfEdge? : HalfEdge

  constructor(position : Vector3, normal? : Vector3, index? : number) {
    this.position = position
    this.normal = normal
    this.index = index
  }
}
