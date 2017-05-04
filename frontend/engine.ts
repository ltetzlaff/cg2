import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import { Octree, Octant, OctreeOptions } from "./Trees/Octree"
import { TreesUtils } from "./Trees/TreesUtils"
import "./OFFFileLoader"

class Engine {
  private canvas : HTMLCanvasElement
  private engine: BABYLON.Engine
  private scene : BABYLON.Scene
  private loader : BABYLON.AssetsManager
  private sun: BABYLON.Light
  private cam : BABYLON.ArcRotateCamera
  
  private findingPattern : TreesUtils.FindingPattern
  private findingOptions : any
  private treeClass : string
  private tree : TreesUtils.Tree
  private vertices : BABYLON.Vector3[]
  private octreeOpts : OctreeOptions
  private visualizeMeshes : BABYLON.Mesh[]
  private visualizeMaterial : BABYLON.Material
  private visualize : boolean
  private wfMat : BABYLON.Material
  
  constructor(canvas : HTMLCanvasElement) {
    this.canvas = canvas
    this.engine = new BABYLON.Engine(canvas, true)
    this.engine.enableOfflineSupport = false

    // Setup Scene
    this.scene = new BABYLON.Scene(this.engine)
    this.loader = new BABYLON.AssetsManager(this.scene)
    this.cam = new BABYLON.ArcRotateCamera("Main Cam", -20, 0, 10, BABYLON.Vector3.Zero(), this.scene)
    this.cam.upperRadiusLimit = 30
    this.cam.lowerRadiusLimit = 2
    this.cam.attachControl(this.canvas, false)
    this.sun = new BABYLON.HemisphericLight("Sun", new BABYLON.Vector3(0, 1, 0), this.scene)

    // Tree Stuff
    this.treeClass = ""
    this.vertices = []
    this.visualizeMeshes = []
    this.visualizeMaterial = new WireFrameMaterial(BABYLON.Color3.Green(), this.scene)
    this.visualize = true
    this.wfMat = new WireFrameMaterial(BABYLON.Color3.Red(), this.scene)    

    const ground = BABYLON.MeshBuilder.CreateGround("Ground", {
      width: 5, height: 5, subdivisions: 1
    }, this.scene)
  }

  run() : void {
    window.addEventListener("resize", () => this.engine.resize())
    this.engine.runRenderLoop(() => this.scene.render())
  }

  buildTree() {
    console.log(this.treeClass)
    switch (this.treeClass) {
      case "Linear":
        // #TODO
        break
      case "Octree":
        this.tree = new Octree(this.vertices, this.octreeOpts)
        this.visualizeTree()
        break
      case "KDtree":
        //this.tree = new KDTree(this.vertices)
        this.visualizeTree()        
        break
      default:
        throw new TypeError("unknown Tree to be constructed")
    }   
  }

  visualizeTree() {
    if (!this.tree) return
    
    const scene = this.scene
    
    // Delete old visuals
    this.visualizeMeshes.forEach(m => m.dispose())
    this.visualizeMeshes = []

    if (!this.visualize) {
      return
    }

    const visualize = (octant : Octant) => {
      const s = octant.size
      const b = BABYLON.MeshBuilder.CreateBox("octant lv" + octant.level, 
        { width: s.x, height: s.y, depth: s.z }, scene)
      b.setAbsolutePosition(octant.center)
      b.material = this.visualizeMaterial
      this.visualizeMeshes.push(b)

      // recurse
      octant.children.forEach(child => visualize(child))
    }
    visualize(this.tree as Octree)
    //BABYLON.SceneOptimizer.OptimizeAsync(scene, BABYLON.SceneOptimizerOptions.ModerateDegradationAllowed())
  }

  setupUIBindings() {
    const buttons = $$(".load").forEach((el : Element) => {
      el.addEventListener("click", () => {
        this.load(el.getAttribute("value") + ".off", true)
      })
    })

    this.octreeOpts = new OctreeOptions(getFloat($("#oBucketSize")), getFloat($("#oMaxDepth")))
    this.findingOptions = {
      k: getFloat($("#p_knearest")),
      radius: getFloat($("#p_radius"))
    }
    this.findingPattern = TreesUtils.FindingPattern[getRadio("query").value]
    this.treeClass = getRadio("search").value

    bindOnChangeNumeric("#oMaxDepth", n => {
      this.octreeOpts.maxDepth = n
      this.buildTree()
    })
    bindOnChangeNumeric("#oBucketSize", n => {
      this.octreeOpts.bucketSize = n
      this.buildTree()
    })    
    bindOnChangeNumeric("#p_knearest", n => this.findingOptions.k = n)
    bindOnChangeNumeric("#p_radius", n => this.findingOptions.radius = n)
    bindOnChangeCheckbox("#visualize", b => {
      this.visualize = b
      this.visualizeTree()
    })

    bindOnChangeRadio("query", s => {
      this.findingPattern = TreesUtils.FindingPattern[s]
    })

    bindOnChangeRadio("search", s => this.treeClass = s)
  }

  setupPicking() {
    // capture mouse events
    window.addEventListener("click", () => {
      if (!this.tree) return
      
      const scene = this.scene
      console.log(scene.pointerX, scene.pointerY)
      const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, null, null)
      
      const results = this.tree.pick(ray, this.findingPattern, this.findingOptions)
      console.log(results)
    }) 
  }

  load(file : string, asPointCloud : boolean = false) : void {
    BABYLON.SceneLoader.ImportMesh(file, "/models/", file, this.scene, meshes => { 
      // Remove old meshes
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

    const boxOptions = { size: .05 }
    const vertCount = vertexCoordinates.length / 3
    const vertices = new Array<BABYLON.Vector3>(vertCount)
    const vertMeshes = new Array<BABYLON.Mesh>(vertCount)
    for (let i = 0; i < vertCount; i++) {
      let j = i * 3
      vertices[i] = new BABYLON.Vector3(vertexCoordinates[j], vertexCoordinates[j+1], vertexCoordinates[j+2])
      vertMeshes[i] = BABYLON.MeshBuilder.CreateBox("v" + i, boxOptions, scene)
      vertMeshes[i].setAbsolutePosition(vertices[i])
      vertMeshes[i].material = mat
    }

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
const $$ = (selector : string) => document.querySelectorAll(selector)
const getFloat = (el : EventTarget) => parseFloat(getString(el))
const getCheckbox = (ev : Event) => (ev.target as HTMLInputElement).checked
const getString = (el : EventTarget) => (el as HTMLInputElement).value
const getRadio = (name : string) => ($("input[name='" + name + "']:checked") as HTMLInputElement)

function bindOnChangeNumeric(selector : string, cb : (n: number) => void) {
  ;($(selector) as HTMLInputElement).onchange = ev => cb(getFloat(ev.target))
}

function bindOnChangeCheckbox(selector : string, cb : (b: boolean) => void) {
  ;($(selector) as HTMLInputElement).onchange = ev => cb(getCheckbox(ev))
}

function bindOnChangeRadio(name : string, cb : (s : string) => void) {
  getRadio(name).onchange = ev => cb(getString(ev.target))
}

var e : Engine
window.addEventListener("DOMContentLoaded", () => {
  e = new Engine(document.querySelector("#c") as HTMLCanvasElement)
  e.setupUIBindings()
  e.setupPicking()
  e.run()  
})