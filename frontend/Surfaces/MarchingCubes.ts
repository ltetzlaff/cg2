import * as BABYLON from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { IVisualizable, showMeshsVertexNormals } from "../Utils"

export enum MCAlgo {
  MarchingCubes, EnhancedMarchingCubes
}

export class MCMesh extends BABYLON.Mesh implements IVisualizable {
  public visualization : BABYLON.Mesh
  public normalVisualization : BABYLON.Mesh
  
  public destroy() {
    if (this.normalVisualization) this.normalVisualization.dispose()
    if (this.visualization) this.visualization.dispose()
    this.dispose()
  }

  visualizeNormals(show : boolean, color : BABYLON.Color3, scene? : BABYLON.Scene) {
    if (this.normalVisualization) this.normalVisualization.dispose()
    if (!show) return

    const ls = showMeshsVertexNormals(this)
    ls.color = color
    this.normalVisualization = ls
  }

  public visualize(show : boolean, material : BABYLON.Material, scene? : BABYLON.Scene) {
    this.isVisible = show
    if (!show) return

    this.material = material
  }
}