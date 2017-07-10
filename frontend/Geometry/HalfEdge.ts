import { Vertex } from "./Vertex"

export class HalfEdge {
  public vertex : Vertex
  public next : HalfEdge
  public prev : HalfEdge
  public opp : HalfEdge

  constructor(vertex : Vertex) {
    this.vertex = vertex
  }

  public getNeighborVertices() : Vertex[] {
    const adjacentVerts : Vertex[] = []
    
    let opp : HalfEdge = this.opp

    // iterate neighborhood
    do {
      adjacentVerts.push(opp.vertex)
      opp = opp.next.opp
    } while (opp !== this.opp // dont loop infinitely
        && opp.next.vertex === this.vertex) // pivot
    return adjacentVerts
  }
}
