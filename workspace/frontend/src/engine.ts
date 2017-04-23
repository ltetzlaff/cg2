/// <reference path="../../node_modules/babylonjs/babylon.d.ts" />
const B = BABYLON
const V3 = BABYLON.Vector3


class Engine {
  private canvas : HTMLCanvasElement
  private engine: BABYLON.Engine
  private scene : BABYLON.Scene
  private loader : BABYLON.AssetsManager
  private sun: BABYLON.Light
  private cam : BABYLON.ArcRotateCamera
  private mesh : BABYLON.AbstractMesh
  private wfMat : BABYLON.Material

  constructor(canvas) {
    this.canvas = canvas
    this.engine = new B.Engine(canvas, true)
    this.engine.enableOfflineSupport = false

    // Setup Scene
    this.scene = new B.Scene(this.engine)
    this.loader = new BABYLON.AssetsManager(this.scene)
    this.cam = new B.ArcRotateCamera("Main Cam", -20, 0, 10, V3.Zero(), this.scene)
    this.cam.attachControl(this.canvas, false)
    this.sun = new B.HemisphericLight("Sun", new V3(0, 1, 0), this.scene)

    let mat = new BABYLON.StandardMaterial("wireframe", this.scene)
	  mat.diffuseColor = BABYLON.Color3.Red()
	  mat.wireframe = true
    this.wfMat = mat

    const ground = B.MeshBuilder.CreateGround("Ground", {
      width: 5, height: 5, subdivisions: 1
    }, this.scene)
  }

  run() : void {
    window.addEventListener("resize", () => this.engine.resize())
    this.engine.runRenderLoop(() => this.scene.render())
  }

  load(file) : void {
    BABYLON.SceneLoader.ImportMesh(file, "/models/", file, this.scene, meshes => { 
      if (this.mesh) this.mesh.dispose()
      this.mesh = meshes[0]
      this.mesh.material = this.wfMat
    })
  }

}

var e : Engine

window.addEventListener("DOMContentLoaded", () => {
  e = new Engine(document.querySelector("#c") as HTMLCanvasElement)
  e.run()
})



