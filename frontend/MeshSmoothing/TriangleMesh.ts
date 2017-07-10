import { Vector3, Mesh, Color3, Scene, Material, VertexBuffer } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { IVisualizable, showMeshsVertexNormals, showVertexNormals } from "../Utils"
import { PointCloud } from "../Surfaces/PointCloud"

import { Vertex } from "../Geometry/Vertex"
import { HalfEdgeStructure } from "./HalfEdgeStructure"
import { HalfEdge } from "../Geometry/HalfEdge"

export class TriangleMesh implements IVisualizable {
  private pointCloud : PointCloud
  private halfEdgeStructure : HalfEdgeStructure

  public visualization : Mesh = null
  public normalVisualization: Mesh
  public fakeNormals : boolean // #DEBUG

  constructor(m : Mesh) {
    this.visualization = m

    // PointCloud
    this.pointCloud = new PointCloud(m)
    
    // HalfEdgeStructure
    const { vertices } = this.pointCloud  
    const indices = m.getIndices() as number[]
    this.halfEdgeStructure = new HalfEdgeStructure(vertices, indices)
  }

  generateVertexNormals() {
    this.pointCloud.vertices.forEach(v => {
      let normal = Vector3.Zero()      

      // Get Adjacent Edges pointing towards v and make weighted sum from their direction
      v.halfEdge.getNeighborVertices().forEach(v2 => {
        const dir = v2.position.subtract(v.position)
        normal.subtractInPlace(dir) // subtract because we want outwards
      })

      v.normal = normal.normalize()
    })
  }

  visualizeNormals(show : boolean, color : string, scene? : Scene) {
    if (this.normalVisualization) this.normalVisualization.dispose()
    if (!show) return

    //this.normalVisualization = showMeshsVertexNormals(this.visualization, color)
    this.normalVisualization = showVertexNormals(this.pointCloud.vertices, scene, color)
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