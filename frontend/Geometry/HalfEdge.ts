import { Vertex } from "./Vertex"

export class HalfEdge {
  public vertex : Vertex
  public next : HalfEdge
  public prev : HalfEdge
  public opp : HalfEdge

  constructor(vertex : Vertex, prev? : HalfEdge, next? : HalfEdge) {
    this.vertex = vertex

    if (prev) {
      this.prev = prev
      prev.next = this
    } else if (next) {
      this.next = next
      next.prev = this
    }
  }
}
