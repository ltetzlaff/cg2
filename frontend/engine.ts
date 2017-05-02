import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import { Octree, Octant } from "./Trees/Octree"
import "./OFFFileLoader"

const globalOctreeOptions : any = {}

const convertToPointCloud = (mesh : BABYLON.AbstractMesh, scene : BABYLON.Scene, mat : BABYLON.Material) => {
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

  // Create Octree
  const octree = new Octree(vertices, globalOctreeOptions)
  const octreeVizMat = new WireFrameMaterial(BABYLON.Color3.Green(), scene)

  const visualize = (octant : Octant, scene : BABYLON.Scene) => {
    const s = octant.size
    const b = BABYLON.MeshBuilder.CreateBox("octant lv" + octant.level, 
      { width: s.x, height: s.y, depth: s.z }, scene)
    b.setAbsolutePosition(octant.center)
    b.material = octreeVizMat

    // recurse
    octant.children.forEach(child => visualize(child, scene))
  }

  visualize(octree, scene)
  Object.defineProperty(window, "octree", { value: octree}) // #debug
}

class Engine {
  private canvas : HTMLCanvasElement
  private engine: BABYLON.Engine
  private scene : BABYLON.Scene
  private loader : BABYLON.AssetsManager
  private sun: BABYLON.Light
  private cam : BABYLON.ArcRotateCamera
  private wfMat : BABYLON.Material

  constructor(canvas) {
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

    this.wfMat = new WireFrameMaterial(BABYLON.Color3.Red(), this.scene)

    const ground = BABYLON.MeshBuilder.CreateGround("Ground", {
      width: 5, height: 5, subdivisions: 1
    }, this.scene)
  }

  run() : void {
    window.addEventListener("resize", () => this.engine.resize())
    this.engine.runRenderLoop(() => this.scene.render())
  }

  load(file : string, asPointCloud : boolean = false) : void {
    BABYLON.SceneLoader.ImportMesh(file, "/models/", file, this.scene, meshes => { 
      // Remove old meshes
      if (this.scene.meshes.length) this.scene.meshes = []
      
      if (asPointCloud) {
        convertToPointCloud(meshes[0], this.scene, this.wfMat)
      } else {
        meshes[0].material = this.wfMat
        this.scene.meshes.push(meshes[0])
      }      
    })
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

var e : Engine
window.addEventListener("DOMContentLoaded", () => {
  e = new Engine(document.querySelector("#c") as HTMLCanvasElement)
  e.run()

  // UI Bindings
  const buttons = $$(".load").forEach((el : Element) => {
    el.addEventListener("click", () => {
      e.load(el.getAttribute("value") + ".off", true)
    })
  })

  // Bind Octree-Configuration (see top) to ui elements
  Object.defineProperty(globalOctreeOptions, "maxDepth", {
    get: () => parseInt(($("#octreeMaxDepth") as HTMLInputElement).value)
  })
  Object.defineProperty(globalOctreeOptions, "bucketSize", {
    get: () => parseInt(($("#octreeBucketSize") as HTMLInputElement).value)
  })
})