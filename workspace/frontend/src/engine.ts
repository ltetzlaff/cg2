/// <reference path="../../node_modules/babylonjs/babylon.d.ts" />
const B = BABYLON
const V3 = BABYLON.Vector3


class Engine {
  private canvas : HTMLCanvasElement
  private engine: BABYLON.Engine
  private scene : BABYLON.Scene
  private sun: BABYLON.Light
  private cam : BABYLON.FreeCamera

  constructor(canvas) {
    this.canvas = canvas
    this.engine = new B.Engine(canvas, true)

    this.scene = new B.Scene(this.engine)
    this.cam = new B.FreeCamera("Main Cam", new V3(0, 5, -10), this.scene)
    this.cam.setTarget(V3.Zero())
    this.sun = new B.DirectionalLight("Sun", new V3(-20, -30, 0), this.scene)

    const ground = B.MeshBuilder.CreateGround("Ground", {
      width: 5, height: 5, subdivisions: 1
    }, this.scene)
  }

  run() : void {
    window.addEventListener("resize", this.engine.resize)
    this.engine.runRenderLoop(() => this.scene.render())
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const e = new Engine(document.querySelector("#c") as HTMLCanvasElement)
  e.run()
})



