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
    this.tree = new Octree(this.vertices, this.octreeOpts)
    this.visualizeTree()
  }

  visualizeTree() {
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

    // Bind Octree-Configuration (see top) to ui elements
    this.octreeOpts = new OctreeOptions(getFloat($("#oBucketSize")), getFloat($("#oMaxDepth")))
    
    ;($("#oMaxDepth") as HTMLInputElement).onchange = ev => {
      this.octreeOpts.maxDepth = getFloat(ev.target)
      this.buildTree()
    }
    ;($("#oBucketSize") as HTMLInputElement).onchange = ev => {
      this.octreeOpts.bucketSize = getFloat(ev.target)
      this.buildTree()
    }

    ;($("#visualize") as HTMLInputElement).onchange = ev => {
      this.visualize = (ev.target as HTMLInputElement).checked
      this.visualizeTree()
    }
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
const getFloat = (el : EventTarget) => parseFloat((el as HTMLInputElement).value)


var e : Engine
window.addEventListener("DOMContentLoaded", () => {
  e = new Engine(document.querySelector("#c") as HTMLCanvasElement)
  e.setupUIBindings()
  e.run()  
})