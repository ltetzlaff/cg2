import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import { IVisualizable } from "./Utils"

export class SurfaceMesh extends BABYLON.Mesh implements IVisualizable {
  public visualization : BABYLON.Mesh

  public visualize(show : boolean, material : BABYLON.Material, _scene?: BABYLON.Scene) {
    this.isVisible = show
    
    if (!show) {
      return
    }

    //this.convertToFlatShadedMesh()    
    this.material = material
  }

  public destroy() {
    this.dispose()
  }
}