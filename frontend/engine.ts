import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import { Octree, Octant, OctreeOptions } from "./Trees/Octree"
import { LinearTree } from "./Trees/LinearTree"
import { TreesUtils } from "./Trees/TreesUtils"
import "./OFFFileLoader"

export class Engine {
  private canvas : HTMLCanvasElement
  private engine: BABYLON.Engine
  public scene : BABYLON.Scene
  private loader : BABYLON.AssetsManager
  private sun: BABYLON.Light
  private cam : BABYLON.ArcRotateCamera
  
  private findingPattern : TreesUtils.FindingPattern
  public findingOptions : any
  public treeClass : string
  public tree : TreesUtils.Tree
  private vertices : BABYLON.Vector3[]
  public octreeOpts : OctreeOptions
  private vertMeshes : BABYLON.InstancedMesh[]
  private visualizeMeshes : BABYLON.Mesh[]
  private visualizeMaterial : BABYLON.Material
  private visualize : boolean
  private wfMat : BABYLON.Material
  private wfMatHighlighted : BABYLON.Material
  private highlighted : BABYLON.InstancedMesh[]

  constructor(canvas : HTMLCanvasElement) {
    this.canvas = canvas
    this.engine = new BABYLON.Engine(canvas, true)
    this.engine.enableOfflineSupport = false

    // Setup Scene
    this.scene = new BABYLON.Scene(this.engine)
    this.loader = new BABYLON.AssetsManager(this.scene)
    this.cam = new BABYLON.ArcRotateCamera("Main Cam", -20, 0, 10, BABYLON.Vector3.Zero(), this.scene)
    this.cam.upperRadiusLimit = 10
    this.cam.lowerRadiusLimit = .5
    this.cam.wheelPrecision = 10
    this.cam.attachControl(this.canvas, false)
    this.sun = new BABYLON.HemisphericLight("Sun", new BABYLON.Vector3(0, 1, 0), this.scene)

    // Tree Stuff
    this.treeClass = ""
    this.vertices = []
    this.visualizeMeshes = []
    this.visualizeMaterial = new WireFrameMaterial(BABYLON.Color3.Green(), this.scene)
    this.visualize = true
    this.wfMat = new WireFrameMaterial(BABYLON.Color3.Red(), this.scene)
    this.wfMatHighlighted = new WireFrameMaterial(BABYLON.Color3.Blue(), this.scene)
    this.highlighted = []
    this.findingOptions = {}
    this.octreeOpts = new OctreeOptions(0, 0, BABYLON.Vector3.Zero())

    const ground = BABYLON.MeshBuilder.CreateGround("Ground", {
      width: 5, height: 5, subdivisions: 1
    }, this.scene)
  }

  run() : void {
    window.addEventListener("resize", () => this.engine.resize())
    this.engine.runRenderLoop(() => {
      this.scene.render()
      this.highlighted.forEach(m => m.rotate(new BABYLON.Vector3(1,1,1), .1))
    })
  }

  buildTree() {
    console.log(this.treeClass)
    switch (this.treeClass) {
      case "Linear":
        this.tree = new LinearTree(this.vertices, this.vertMeshes, this.octreeOpts.pointSize)
        break
      case "Octree":
        this.tree = new Octree(this.vertices, this.vertMeshes, this.octreeOpts)
        break
      case "KDtree":
        //this.tree = new KDTree(this.vertices)
        break
      default:
        throw new TypeError("unknown Tree to be constructed")
    }

    this.visualizeTree()    
  }

  visualizeTree() {
    if (!this.tree) return
    
    // Delete old visuals
    this.visualizeMeshes.forEach(m => m.dispose())
    this.visualizeMeshes = []

    if (!this.visualize) {
      return
    }

    this.tree.visualize(this.scene, this.visualizeMeshes, this.visualizeMaterial)    
    //BABYLON.SceneOptimizer.OptimizeAsync(scene, BABYLON.SceneOptimizerOptions.ModerateDegradationAllowed())
    //BABYLON.SceneOptimizer.OptimizeAsync(this.scene, BABYLON.SceneOptimizerOptions.ModerateDegradationAllowed())
  }

  setupUIBindings() {
    $$(".load").forEach((el : Element) => {
      el.addEventListener("click", () => {
        this.load(el.getAttribute("value") + ".off", true)
      })
    })

    bindOnChangeFile("#load", fl => {
      this.load(fl[0].name, true)
    })

    const s = getFloat($("#pPointSize"))
    this.octreeOpts.bucketSize = getFloat($("#oBucketSize"))
    this.octreeOpts.maxDepth = getFloat($("#oMaxDepth"))
    this.octreeOpts.pointSize = new BABYLON.Vector3(s,s,s)
    this.findingOptions.k = getFloat($("#pKNearest"))
    this.findingOptions.radius = getFloat($("#pRadius"))
    
    this.findingPattern = TreesUtils.FindingPattern[getRadioValue("query")]
    this.treeClass = getRadioValue("search")

    bindOnChangeNumeric("#oMaxDepth", n => {
      this.octreeOpts.maxDepth = n
      this.buildTree()
    })
    bindOnChangeNumeric("#oBucketSize", n => {
      this.octreeOpts.bucketSize = n
      this.buildTree()
    })    
    bindOnChangeNumeric("#pPointSize", n => {
      this.octreeOpts.pointSize.x = n
      this.octreeOpts.pointSize.y = n
      this.octreeOpts.pointSize.z = n
      this.buildTree()
    })
    bindOnChangeNumeric("#pKNearest", n => this.findingOptions.k = n)
    bindOnChangeNumeric("#pRadius", n => this.findingOptions.radius = n)
    bindOnChangeCheckbox("#visualize", b => {
      this.visualize = b
      this.visualizeTree()
    })

    bindOnChangeRadio("query", s => {
      this.findingPattern = TreesUtils.FindingPattern[s]
    })

    bindOnChangeRadio("search", s => {
      this.treeClass = s
      this.buildTree()
    })
    window.addEventListener("keydown", ev => {
      if (ev.keyCode == 107 || ev.keyCode == 87) this.cam.radius -= .1
      if (ev.keyCode == 106 || ev.keyCode == 83) this.cam.radius += .1
    })
  }

  setupPicking() {
    // capture mouse events
    window.addEventListener("click", (ev) => {
      if (!this.tree) return

      const scene = this.scene
            
      if (ev.clientX > this.canvas.width - 2) return // in ui
      const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, null, null)
      console.log("")
      console.time("took in total")
      //console.log(JSON.stringify(ray))
      const results = this.tree.pick(ray, this.findingPattern, this.findingOptions)
      console.log("picked at (" + scene.pointerX + "|" + scene.pointerY + "):", results.length + (results.length === 1 ? " point" : " points"))
      console.timeEnd("took in total")
      this.highlight(results.map(p => p.mesh))
    })
  }

  highlight(meshes : BABYLON.InstancedMesh[]) {
    // unhighlight
    this.highlighted.forEach(m => m.rotationQuaternion = BABYLON.Quaternion.Identity())
    //this.highlighted.forEach(m => m.material = this.wfMat)
    //this.highlighted.forEach(m => m.isVisible = true)

    //meshes.forEach(m => m.isVisible = false)
    //meshes.forEach(m => m.material = this.wfMatHighlighted)
    this.highlighted = meshes
  }

  load(file : string, asPointCloud : boolean = false) : void {
    BABYLON.SceneLoader.ImportMesh(file, "/models/", file, this.scene, (meshes : BABYLON.AbstractMesh[]) => { 
      // Remove old meshes
      this.scene.meshes.forEach(m => m.dispose())
      if (this.scene.meshes.length) this.scene.meshes = []
      
      if (asPointCloud) {
        this.convertToPointCloud(meshes[0], this.scene, this.wfMat)
      } else {
        meshes[0].material = this.wfMat
        this.scene.meshes.push(meshes[0])
      }      
    })
  }

  convertToPointCloud(mesh : BABYLON.AbstractMesh, scene : BABYLON.Scene, mat : BABYLON.Material) {
    const vertexCoordinates = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)
        
    if (vertexCoordinates.length % 3 !== 0) {
      throw new RangeError("Vertices array doesn't seem to consist of Vector3s")
    }

    const vertCount = vertexCoordinates.length / 3
    const vertices = new Array<BABYLON.Vector3>(vertCount)
    const vertMeshes = new Array<BABYLON.InstancedMesh>(vertCount)
    const vertMesh = BABYLON.MeshBuilder.CreateBox("vertMesh", { size: 1 }, scene)
    vertMesh.material = mat
    vertMesh.isVisible = false
    for (let i = 0; i < vertCount; i++) {
      let j = i * 3
      vertices[i] = new BABYLON.Vector3(vertexCoordinates[j], vertexCoordinates[j+1], vertexCoordinates[j+2])
      vertMeshes[i] = vertMesh.createInstance("v" + i)
      vertMeshes[i].setAbsolutePosition(vertices[i])
      vertMeshes[i]
    }
    this.vertMeshes = vertMeshes

    //scene.meshes.push(...vertMeshes) 
    this.vertices = vertices
    this.buildTree()
  }
}

class WireFrameMaterial extends BABYLON.StandardMaterial {
  constructor(color : BABYLON.Color3, scene : BABYLON.Scene) {
    super("wireframe", scene)
    this.diffuseColor = color
    //this.disableLighting = true
	  this.wireframe = true
  }
}

const $  = (selector : string) => document.querySelector(selector)
const $$ = (selector : string) => Array.prototype.slice.call(document.querySelectorAll(selector))
const getFloat = (el : EventTarget) => parseFloat(getString(el))
const getCheckbox = (ev : Event) => (ev.target as HTMLInputElement).checked
const getString = (el : EventTarget) => (el as HTMLInputElement).value
const getRadio = (name : string) =>$$("input[name='" + name + "']") as HTMLInputElement[]
const getRadioValue = (name : string) => getRadio(name).find(el => el.checked).value
const getFiles = (el : EventTarget) => (el as HTMLInputElement).files

function bindOnChangeNumeric(selector : string, cb : (n: number) => void) {
  ;($(selector) as HTMLInputElement).onchange = ev => cb(getFloat(ev.target))
}

function bindOnChangeCheckbox(selector : string, cb : (b: boolean) => void) {
  ;($(selector) as HTMLInputElement).onchange = ev => cb(getCheckbox(ev))
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