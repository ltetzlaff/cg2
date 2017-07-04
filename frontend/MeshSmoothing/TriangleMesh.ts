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
      const f = new Face()
      f.index = fi
      
      // Loop Vertices of Triangle
      const edges = [
        { a : indices[i + 0], b : indices[i + 1] },
        { a : indices[i + 1], b : indices[i + 2] },
        { a : indices[i + 2], b : indices[i + 0] },        
      ]

      const he0 = new HalfEdge(vertices[edges[0].a])
      halfEdges.push(he0)
      const he1 = new HalfEdge(vertices[edges[0].b], he0)
      halfEdges.push(he1)
      const he2 = new HalfEdge(vertices[edges[1].a], he1)
      
      f.startEdge
      faces.push(f)
    } 


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