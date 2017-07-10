import { Vertex } from "../Geometry/Vertex"
import { Face } from "../Geometry/Face"
import { HalfEdge } from "../Geometry/HalfEdge"

export class HalfEdgeStructure {
  private halfEdges : HalfEdge[] = []    
  private faces : Face[] = []

  constructor(vertices : Vertex[], indices : number[]) {    
    this.halfEdges = []
    this.faces = []
    const { halfEdges, faces } = this
    
    // Loop Faces
    for (let i = 0, fi = 0, len = indices.length; i < len; i += 3, fi++) {
      
      // Loop Vertices of Triangle
      const he = [0, 1, 2].map(j => {
        const corner = vertices[indices[i + j]]
        const h = new HalfEdge(corner)
        corner.halfEdge = h
        return h
      })

      // Create HalfEdges
      he[0].prev = he[2]
      he[0].next = he[1]
      
      he[1].prev = he[0]
      he[1].next = he[2]

      he[2].prev = he[1]
      he[2].next = he[0]

      halfEdges.push(...he)      

      // Create Face
      faces.push(new Face(he[0], fi))
    } 

    // Find opposing edges
    const oppositeForEveryHE = halfEdges.every(h => {
      if (h.opp) return true
      
      const start = h.vertex
      const end = h.next.vertex

      return halfEdges.some(h2 => {
        if (h2.vertex === end && h2.next.vertex === start) {
          h.opp = h2
          h2.opp = h
          return true
        }
        return false
      })
    })
    if (oppositeForEveryHE) {
      console.log("found opposite for halfEdges")
    } else {
      console.log(
        "couldn't find opposites for halfEdges:",
        halfEdges.filter(h =>  h.opp === null)
      )
    }
  }
}