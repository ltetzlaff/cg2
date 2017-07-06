import { HalfEdge } from "./HalfEdge" 

export class Face {
  public startEdge : HalfEdge
  public index : number

  constructor(startEdge : HalfEdge, index : number) {
    this.startEdge = startEdge
    this.index = index
  }
}