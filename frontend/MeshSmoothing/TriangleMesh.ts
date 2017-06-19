import { Vector3, Mesh, Color3, Scene, Material, VertexBuffer } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { IVisualizable, showMeshsVertexNormals } from "../Utils"


export class TriangleMesh extends Mesh implements IVisualizable {
  public visualization : Mesh = null
  public normalVisualization: Mesh
  public fakeNormals : boolean // #DEBUG

  public destroy() {
    if (this.normalVisualization) this.normalVisualization.dispose()
    if (this.visualization) this.visualization.dispose()
    this.dispose()
  }

  visualizeNormals(show : boolean, color : string, scene? : Scene) {
    if (this.normalVisualization) this.normalVisualization.dispose()
    if (!show) return

    this.normalVisualization = showMeshsVertexNormals(this, color)
  }

  public visualize(show : boolean, material : Material, scene?: Scene) {
    this.isVisible = show
    if (!show) return

    if (!this.fakeNormals) { // #DEBUG
      this.convertToFlatShadedMesh()
    }

    this.material = material
  }
}