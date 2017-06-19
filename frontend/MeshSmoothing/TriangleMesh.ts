import { Vector3, Mesh, Color3, Scene, Material, VertexBuffer } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { IVisualizable, showMeshsVertexNormals } from "../Utils"


export class TriangleMesh implements IVisualizable {
  public visualization : Mesh = null
  public normalVisualization: Mesh
  public fakeNormals : boolean // #DEBUG

  constructor(m : Mesh) {
    this.visualization = m
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