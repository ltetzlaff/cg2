import * as BABYLON from "../node_modules/babylonjs/babylon.module"

export interface IVisualizable {
  visualization : BABYLON.InstancedMesh[] | BABYLON.Mesh[] | BABYLON.Mesh

  visualize(showOrHide : boolean, scene : BABYLON.Scene, material : BABYLON.Material) : void

  destroy() : void
}