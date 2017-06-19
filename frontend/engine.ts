import { 
  Vector3, Mesh, AbstractMesh, 
  ArcRotateCamera, PointLight, Light, Scene, Material,
  Engine, AssetsManager, SceneLoader
} from "../node_modules/babylonjs/dist/preview release/babylon.module"
import { TriangleMesh } from "./MeshSmoothing/TriangleMesh"
import { StdMaterial, PointCloudMaterial, WireFrameMaterial } from "./Utils"

export class App {
  private canvas : HTMLCanvasElement
  private engine: Engine
  public scene : Scene
  private loader : AssetsManager
  private light: Light
  private lightPivot : Mesh
  private cam : ArcRotateCamera

  private mat : any  
  private sourceMesh : TriangleMesh

  constructor(canvas : HTMLCanvasElement) {
    this.canvas = canvas
    this.engine = new Engine(canvas as any, true)
    this.engine.enableOfflineSupport = null

    // Setup Scene
    const s = new Scene(this.engine)
    this.scene = s
    this.loader = new AssetsManager(s)
    this.cam = new ArcRotateCamera("Main Cam", -15.97, 1.22, 28.6, Vector3.Zero(), s)
    this.cam.upperRadiusLimit = 50
    this.cam.lowerRadiusLimit = 10
    this.cam.wheelPrecision = 10
    this.cam.attachControl(this.canvas, false)
    //new HemisphericLight("sun", new Vector3(0, 1, 0), s)
    this.light = new PointLight("light", new Vector3(0, 2.5, 10), s)
    this.lightPivot = new Mesh("lightPivot", s)
    this.lightPivot.setAbsolutePosition(new Vector3(0, 0, 10))
    this.light.parent = this.lightPivot

    this.mat = {
      sourceMesh: new StdMaterial("purple", s)
    }
  }

  run() : void {
    window.addEventListener("resize", () => this.engine.resize())
    this.engine.runRenderLoop(() => {
      this.scene.render()
    })
  }

  setupUIBindings() {
    $$(".load").forEach((el : Element) => {
      el.addEventListener("click", () => {
        this.load(el.getAttribute("value") + ".obj", true)
      })
    })

    let sel = ""
    
    sel = "#pVisualizeSourceMesh"
    bindOnChangeCheckbox(sel, b => {
      if (this.sourceMesh) this.sourceMesh.visualize(b, this.mat.sourceMesh, this.scene)
    })

    sel = "#pVisualizeVertexNormals"
    bindOnChangeCheckbox(sel, b => {
      if (this.sourceMesh) this.sourceMesh.visualizeNormals(b, "white", this.scene)
    })

    bindOnChangeFile("#load", fl => {
      this.load(fl[0].name, true)
      if (this.sourceMesh) {
        this.sourceMesh.visualize(getCheckbox($("#pVisualizeSourceMesh")), this.mat.sourceMesh, this.scene)
        this.sourceMesh.visualizeNormals(getCheckbox($("#pVisualizeVertexNormals")), "white", this.scene)
      }
    })

    window.addEventListener("keydown", ev => {
      if (ev.keyCode == 107 || ev.keyCode == 81) this.cam.radius -= .1 // num+, q
      if (ev.keyCode == 106 || ev.keyCode == 69) this.cam.radius += .1 // num-, e
      if (ev.keyCode == 87) this.cam.beta += .1 // w
      if (ev.keyCode == 83) this.cam.beta -= .1 // s
      if (ev.keyCode == 65) this.cam.alpha += .1 // a
      if (ev.keyCode == 68) this.cam.alpha -= .1 // d
    })

    var lastX = 0
    var lastY = 0
    window.addEventListener("mousemove", ev => {
      const factor = 1/50
      const dx = (ev.offsetX - lastX) * factor
      const dy = (ev.offsetY - lastY) * factor
      lastX = ev.offsetX
      lastY = ev.offsetY
      if (ev.ctrlKey) {
        if (lastX !== 0) this.lightPivot.rotate(new Vector3(0, 0, 1), -dx)
        if (lastY !== 0) this.lightPivot.rotate(new Vector3(0, 1, 0), -dy)
      }
    })
  }

  load(file : string, asPointCloud : boolean = false) : void {
    SceneLoader.ImportMesh(file, "/models/", file, this.scene, (meshes : AbstractMesh[]) => {
      // Remove old meshes
      //this.scene.meshes.forEach(m => m.dispose())
      if (this.scene.meshes.length) this.scene.meshes = []

      meshes[0].material = this.mat.sourceMesh
      this.scene.meshes.push(meshes[0])
      this.sourceMesh = meshes[0] as TriangleMesh
    })
  }
}

const $  = (selector : string) => document.querySelector(selector)
const $$ = (selector : string) => Array.prototype.slice.call(document.querySelectorAll(selector))
const getFloat = (el : EventTarget) => parseFloat(getString(el))
const getCheckbox = (el : EventTarget) => (el as HTMLInputElement).checked
const getString = (el : EventTarget) => (el as HTMLInputElement).value
const getRadio = (name : string) =>$$("input[name='" + name + "']") as HTMLInputElement[]
const getRadioValue = (name : string) => getRadio(name).find(el => el.checked).value
const getFiles = (el : EventTarget) => (el as HTMLInputElement).files

function bindOnChangeNumeric(selector : string, cb : (n: number) => void) {
  ;($(selector) as HTMLInputElement).onchange = ev => cb(getFloat(ev.target))
}

function bindOnChangeCheckbox(selector : string, cb : (b: boolean) => void) {
  ;($(selector) as HTMLInputElement).onchange = ev => cb(getCheckbox(ev.target))
}

function bindOnChangeRadio(name : string, cb : (s : string) => void) {
  getRadio(name).forEach(el => {
    el.onchange = ev => {
      const i = ev.target
      if ((i as HTMLInputElement).checked) cb(getString(i))
    }
  })
}

function bindOnChangeFile(selector: string, cb : (fl : FileList) => void) {
  ;($(selector) as HTMLInputElement).onchange = ev => cb(getFiles(ev.target))
}