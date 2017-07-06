import { Vector3, Mesh, Color3, Scene, Material, VertexBuffer } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { IVisualizable, showMeshsVertexNormals } from "../Utils"
import { PointCloud } from "../Surfaces/PointCloud"

import { Vertex } from "../Geometry/Vertex"
import { HalfEdge } from "../Geometry/HalfEdge"
import { Face } from "../Geometry/Face"

export class TriangleMesh implements IVisualizable {
  private pointCloud : PointCloud

  public visualization : Mesh = null
  public normalVisualization: Mesh
  public fakeNormals : boolean // #DEBUG

  constructor(m : Mesh) {
    this.visualization = m

    this.pointCloud = new PointCloud(m)

    // HE DS
    // VERTICES
    const vertices : Vertex[] = this.pointCloud.vertices
    
    // FACES
    const indices = m.getIndices() as number[]
    const halfEdges : HalfEdge[] = []    
    const faces : Face[] = []
    
    // Loop Faces
    for (let i = 0, fi = 0, len = indices.length; i < len; i += 3, fi++) {
      
      // Loop Vertices of Triangle
      const edges = [
        { a : indices[i + 0], b : indices[i + 1] },
        { a : indices[i + 1], b : indices[i + 2] },
      //  { a : indices[i + 2], b : indices[i + 0] },  // not needed here       
      ]

      // Create HalfEdges
      const h0 = new HalfEdge(vertices[edges[0].a])
      const h1 = new HalfEdge(vertices[edges[0].b], h0)
      const h2 = new HalfEdge(vertices[edges[1].a], h1)

      h0.prev = h2
      h0.next = h1

      h1.prev = h0
      h1.next = h2

      h2.prev = h1
      h2.next = h0

      halfEdges.push(h0, h1, h2)      

      // Create Face
      faces.push(new Face(h0, fi))
    } 

    // Find opposing edges
    halfEdges.forEach(h => {
      if (h.opp) return
      
      const start = h.vertex
      const end = h.next.vertex

      // #TODO
      halfEdges.forEach(h2 => {
        if ()
      })
    })
  }

  generateVertexNormals() {
    const pc = this.pointCloud
    pc.vertices.forEach(v => {
      /*pc.tree.query()
      
      v.normal = Vector3.Cross()*/

    })
  }

  visualizeNormals(show : boolean, color : string, scene? : Scene) {
    if (this.normalVisualization) this.normalVisualization.dispose()
    if (!show) return

    this.normalVisualization = showMeshsVertexNormals(this.visualization, color)
  }
  
  public visualize(show : boolean, material : Material, scene : Scene) {
    if (this.visualization) this.visualization.isVisible = show
    if (!show) return
    
    this.visualization.material = material
  }

  public destroy() {
    if (this.visualization) this.visualization.dispose()
    if (this.normalVisualization) this.normalVisualization.dispose()
  }
}