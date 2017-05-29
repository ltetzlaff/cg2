import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import { TreesUtils } from "./Trees/TreesUtils"
import { Tree } from "./Trees/Tree"
import { getExtents } from "./Utils"
import { Octree, OctreeOptions } from "./Trees/Octree"
import { PointCloud } from "./Surfaces/PointCloud"
import { Grid3D, GridOptions } from "./Surfaces/Grid3D"
import { Surface } from "./Surfaces/Surface"
import { ImplicitSamples } from "./Surfaces/ImplicitSamples"
import { MCMesh, MCAlgo } from "./Surfaces/MarchingCubes"
import "./OFFFileLoader"

export class Engine {
  private canvas : HTMLCanvasElement
  private engine: BABYLON.Engine
  public scene : BABYLON.Scene
  private loader : BABYLON.AssetsManager
  private sun: BABYLON.Light
  private cam : BABYLON.ArcRotateCamera

  private pointCloud : PointCloud
  private mat : any  
  private gridOptions : GridOptions
  private grid : Grid3D
  private surface : Surface
  private implicitSamples : ImplicitSamples
  private mcMesh : MCMesh

  constructor(canvas : HTMLCanvasElement) {
    this.canvas = canvas
    this.engine = new BABYLON.Engine(canvas, true)
    this.engine.enableOfflineSupport = false

    // Setup Scene
    const s = new BABYLON.Scene(this.engine)
    this.scene = s
    this.loader = new BABYLON.AssetsManager(s)
    this.cam = new BABYLON.ArcRotateCamera("Main Cam", -15.97, 1.22, 2860, BABYLON.Vector3.Zero(), s)
    this.cam.upperRadiusLimit = 5000
    this.cam.lowerRadiusLimit = 1000
    this.cam.wheelPrecision = 10
    this.cam.attachControl(this.canvas, false)
    this.sun = new BABYLON.HemisphericLight("Sun", new BABYLON.Vector3(0, 1, 0), s)

    this.mat = {
      points: new PointCloudMaterial("red", s),
      tree: new WireFrameMaterial("yellow", s),
      grid: new WireFrameMaterial("blue", s),
      implicitSample: new PointCloudMaterial("green", s),
      mcMesh: new Material("purple", s)
    }
    
    this.gridOptions = new GridOptions()

    const ground = BABYLON.MeshBuilder.CreateGround("Ground", {
      width: 5, height: 5, subdivisions: 1
    }, this.scene)
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
        this.load(el.getAttribute("value") + ".off", true)
      })
    })

    let sel = ""
    const go = this.gridOptions
    go.findingPattern = TreesUtils.FindingPattern.Radius

    // Point Cloud
    sel = "#pVisualizePointCloud"
    bindOnChangeCheckbox(sel, b => {
      if (this.pointCloud) this.pointCloud.visualize(b, this.mat.points)
    })

    sel = "#pVisualizeVertexNormals"
    bindOnChangeCheckbox(sel, b => {
      if (this.pointCloud) this.pointCloud.visualizeNormals(b, getColor("white"), this.scene)
    })

    sel = "#pVisualizeTree"
    bindOnChangeCheckbox(sel, b => {
      if (this.pointCloud) this.pointCloud.tree.visualize(b, this.mat.tree, this.scene)
    })

    // Grid3D
    sel = "#pSubdivisions"
    go.subdivisions = getFloat($(sel))
    bindOnChangeNumeric(sel, n => {
      go.subdivisions = n
      this.buildGrid()
    })

    sel = "#pBBPadding"
    go.subdivisions = getFloat($(sel))
    bindOnChangeNumeric(sel, n => {
      go.padding = n
      this.buildGrid()
    })

    sel = "#pVisualizeGrid"
    bindOnChangeCheckbox(sel, b => {
      if (this.grid) this.grid.visualize(b, this.mat.Grid3D, this.scene)
    })

    // Implicit Sampling
    sel = "#pRadius"
    go.radius = getFloat($(sel))
    bindOnChangeNumeric(sel, n => {
      go.radius = n
      this.runImplicitSampling()
    })

    sel = "#pWendlandRadius"
    go.wendlandRadius = getFloat($(sel))
    bindOnChangeNumeric(sel, n => {
      go.wendlandRadius = n
      this.runImplicitSampling()
    })

    sel = "#pRunImplicitSampling"
    go.runImplicitSampling= getCheckbox($(sel))
    bindOnChangeCheckbox(sel, b => {
      go.runImplicitSampling = b
      this.runImplicitSampling()
    })

    sel = "#pVisualizeImplicit"
    bindOnChangeCheckbox(sel, b => {
      if (this.implicitSamples) this.implicitSamples.visualize(b, this.mat.implicitSamples, this.scene)
    })

    // Marching Cubes
    sel = "mcAlgo"
    go.mcAlgo = MCAlgo[getRadioValue(sel)]
    bindOnChangeRadio(sel, s => {
      go.mcAlgo = MCAlgo[s]
      this.buildMCMesh()
    })

    sel = "#pBuildMCMesh"
    go.buildMCMesh = getCheckbox($(sel))
    bindOnChangeCheckbox(sel, b => {
      go.buildMCMesh = b
      this.buildMCMesh()
    })

    sel = "#pVisualizeMCMesh"
    bindOnChangeCheckbox(sel, b => {
      if (this.mcMesh) this.mcMesh.visualize(b, this.mat.MCMesh, this.scene)
    })

    bindOnChangeFile("#load", fl => {
      this.load(fl[0].name, true)
    })

    window.addEventListener("keydown", ev => {
      if (ev.keyCode == 107 || ev.keyCode == 81) this.cam.radius -= .1 // num+, q
      if (ev.keyCode == 106 || ev.keyCode == 69) this.cam.radius += .1 // num-, e
      if (ev.keyCode == 87) this.cam.beta += .1 // w
      if (ev.keyCode == 83) this.cam.beta -= .1 // s
      if (ev.keyCode == 65) this.cam.alpha += .1 // a
      if (ev.keyCode == 68) this.cam.alpha -= .1 // d
    })
  }

  buildGrid() {
    if (this.grid) this.grid.destroy()

    if (!this.gridOptions.buildGrid) return
    if (!this.pointCloud || this.pointCloud.vertices.length === 0) return

    const { min, max } = getExtents(this.pointCloud.vertices)

    console.time("-- built Grid3D in:")
    this.grid = new Grid3D(min, max, this.gridOptions)
    console.timeEnd("-- built Grid3D in:")

    this.grid.visualize(getCheckbox($("#pVisualizeGrid")), this.mat.grid, this.scene)

    this.runImplicitSampling()
  }

  runImplicitSampling() {
    if (this.implicitSamples) this.implicitSamples.destroy()

    if (!this.gridOptions.runImplicitSampling) return

    // #TODO

    this.buildMCMesh()
  }

  buildMCMesh() {
    if (this.mcMesh) this.mcMesh.destroy()

    if (!this.gridOptions.buildMCMesh) return

    // #TODO  
  }

  load(file : string, asPointCloud : boolean = false) : void {
    BABYLON.SceneLoader.ImportMesh(file, "/models/", file, this.scene, (meshes : BABYLON.AbstractMesh[]) => {
      // Remove old meshes
      this.scene.meshes.forEach(m => m.dispose())
      //if (this.scene.meshes.length) this.scene.meshes = []
      console.log(this.scene.meshes)

      if (asPointCloud) {
        this.pointCloud = new PointCloud(meshes[0] as BABYLON.Mesh, file)
        this.pointCloud.visualize(getCheckbox($("#pVisualizePointCloud")), this.mat.points)
        this.pointCloud.visualizeNormals(getCheckbox($("#pVisualizeVertexNormals")), getColor("white"), this.scene)
        this.buildGrid()
      } else {
        meshes[0].material = this.mat.points
        this.scene.meshes.push(meshes[0])
      }
    })
  }
}

function capitalize(str : string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
function getColor(str : string) {
  return BABYLON.Color3[capitalize(str)]()
}

class Material extends BABYLON.StandardMaterial {
  constructor(color : string, scene : BABYLON.Scene) {
    super("mat", scene)
    this.diffuseColor = getColor(color)
  }
}

class PointCloudMaterial extends BABYLON.StandardMaterial {
  constructor(color : string, scene : BABYLON.Scene) {
    super("pointCloud", scene)
    this.diffuseColor = getColor(color)
    this.pointsCloud = true
    this.pointSize = 4
  }
}

class WireFrameMaterial extends BABYLON.StandardMaterial {
  constructor(color : string, scene : BABYLON.Scene) {
    super("wireframe", scene)
    this.diffuseColor = getColor(color)
	  this.wireframe = true
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