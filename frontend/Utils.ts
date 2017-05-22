import * as BABYLON from "../node_modules/babylonjs/babylon.module"

export interface IVisualizable {
  visualization : BABYLON.InstancedMesh[] | BABYLON.Mesh[] | BABYLON.Mesh

  visualize(showOrHide : boolean, material : BABYLON.Material, scene?: BABYLON.Scene) : void

  destroy() : void
}