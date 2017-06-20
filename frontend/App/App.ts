import { 
  Vector3, Mesh, AbstractMesh, 
  ArcRotateCamera, PointLight, Light, Scene, Material,
  Engine, AssetsManager, SceneLoader
} from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { TriangleMesh } from "../MeshSmoothing/TriangleMesh"
import { StdMaterial, PointCloudMaterial, WireFrameMaterial } from "../Utils"
import { UI, UIElementType as Type } from "./UI"
import "./OBJFileLoader"

export class App {
  private canvas : HTMLCanvasElement
  private engine: Engine
  public scene : Scene
  private loader : AssetsManager
  private light: Light
  private lightPivot : Mesh
  private cam : ArcRotateCamera
  private ui : UI

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

    this.ui = new UI()
  }

  run() : void {
    window.addEventListener("resize", () => this.engine.resize())
    this.engine.runRenderLoop(() => {
      this.scene.render()
    })
  }

  setupUIBindings() {
    const { ui } = this

    ui.bind("#pVisualizeSourceMesh", Type.Checkbox, b => {
      if (this.sourceMesh) this.sourceMesh.visualize(b, this.mat.sourceMesh, this.scene)
    })

    ui.bind("#pVisualizeVertexNormals", Type.Checkbox, b => {
      if (this.sourceMesh) this.sourceMesh.visualizeNormals(b, "white", this.scene)
    })

    ui.bind("#load", Type.File, fl => {
      this.load(fl[0].name, true)
    })

    ui.bindFileShortcuts(".load", fileName => {
      this.load(fileName + ".obj", true)
    })

    ui.bindCameraKeys(this.cam)
    ui.bindLightPivot(this.lightPivot)
  }

  load(file : string, asPointCloud : boolean = false) : void {
    SceneLoader.ImportMesh(file, "/models/", file, this.scene, (meshes : AbstractMesh[]) => {
      // Remove old meshes
      //this.scene.meshes.forEach(m => m.dispose())
      if (this.scene.meshes.length) this.scene.meshes = []

      meshes[0].material = this.mat.sourceMesh
      this.scene.meshes.push(meshes[0])
      this.sourceMesh = new TriangleMesh(meshes[0] as Mesh)
      
      if (this.sourceMesh) {
        const { ui } = this
        const viz = ui.get("#pVisualizeSourceMesh", Type.Checkbox) as boolean
        const vizNormals = ui.get("#pVisualizeVertexNormals", Type.Checkbox) as boolean
        this.sourceMesh.visualize(viz, this.mat.sourceMesh, this.scene)
        this.sourceMesh.visualizeNormals(vizNormals, "white", this.scene)
        this.sourceMesh.visualization.convertToFlatShadedMesh()
      }
    })
  }
}

