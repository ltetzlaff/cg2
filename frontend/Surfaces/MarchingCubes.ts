import { Vector3, Mesh, Scene, Material } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { IVisualizable, showMeshsVertexNormals } from "../Utils"

export enum MCAlgo {
  MarchingCubes, EnhancedMarchingCubes
}

export class MCMesh extends Mesh implements IVisualizable {
  public visualization : Mesh
  public normalVisualization : Mesh
  
  public destroy() {
    if (this.normalVisualization) this.normalVisualization.dispose()
    if (this.visualization) this.visualization.dispose()
    this.dispose()
  }

  visualizeNormals(show : boolean, color : string, scene? : Scene) {
    if (this.normalVisualization) this.normalVisualization.dispose()
    if (!show) return

    const ls = showMeshsVertexNormals(this, color)
    this.normalVisualization = ls
  }

  public visualize(show : boolean, material : Material, scene? : Scene) {
    this.isVisible = show
    if (!show) return

    this.material = material
  }
}