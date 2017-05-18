import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import { TreesUtils } from "./Trees/TreesUtils"
import { Tree } from "./Trees/Tree"
import { Octree, OctreeOptions } from "./Trees/Octree"
import { Grid, GridOptions, Surface, SurfaceMesh, Level } from "./Surface"
import "./OFFFileLoader"

export class Engine {
  private canvas : HTMLCanvasElement
  private engine: BABYLON.Engine
  public scene : BABYLON.Scene
  private loader : BABYLON.AssetsManager
  private sun: BABYLON.Light
  private cam : BABYLON.ArcRotateCamera

  private pSize : BABYLON.Vector3
  private tree : Tree
  private octreeOptions : OctreeOptions
  private vertices : BABYLON.Vector3[]
  private vertMeshes : BABYLON.InstancedMesh[]
  private pointMat : BABYLON.Material
  private gridMat : BABYLON.Material
  private surfaceMat : BABYLON.Material
  private gridOptions : GridOptions
  private grid : Grid
  private surface : Surface
  private surfaceMesh : SurfaceMesh

  constructor(canvas : HTMLCanvasElement) {
    this.canvas = canvas
    this.engine = new BABYLON.Engine(canvas, true)
    this.engine.enableOfflineSupport = false

    // Setup Scene
    this.scene = new BABYLON.Scene(this.engine)
    this.loader = new BABYLON.AssetsManager(this.scene)
    this.cam = new BABYLON.ArcRotateCamera("Main Cam", -18.1, 1.1, 4.3, BABYLON.Vector3.Zero(), this.scene)
    this.cam.upperRadiusLimit = 10
    this.cam.lowerRadiusLimit = .5
    this.cam.wheelPrecision = 10
    this.cam.attachControl(this.canvas, false)
    this.sun = new BABYLON.HemisphericLight("Sun", new BABYLON.Vector3(0, 1, 0), this.scene)

    this.vertices = []
    this.pointMat = new WireFrameMaterial(BABYLON.Color3.Red(), this.scene)
    this.gridMat = new WireFrameMaterial(BABYLON.Color3.Blue(), this.scene)
    this.surfaceMat = new WireFrameMaterial(BABYLON.Color3.Green(), this.scene)

    const s = .005
    this.pSize = new BABYLON.Vector3(s,s,s)
    this.octreeOptions = new OctreeOptions(60, 5, this.pSize)
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

    sel = "#pResolution"
    go.resolution = getFloat($(sel))
    bindOnChangeNumeric(sel, n => {
      go.resolution = n
      this.buildGrid()
    })

    sel = "yLevel"
    go.yLevel = Level[getRadioValue(sel)]
    bindOnChangeRadio(sel, s => {
      go.yLevel = Level[s]
      this.buildGrid()
    })

    /*
    sel = "#pSubdivisions"
    go.subdivisions = getFloat($(sel))
    bindOnChangeNumeric(sel, n => {
      go.subdivisions = n
    })
    */

    sel = "query"
    go.findingPattern = TreesUtils.FindingPattern[getRadioValue(sel)]
    bindOnChangeRadio(sel, s => {
      go.findingPattern = TreesUtils.FindingPattern[s]
      this.buildSurface()
    })

    sel = "#pKNearest"
    go.k = getFloat($(sel)) | 0
    bindOnChangeNumeric(sel, n => {
      go.k = n | 0
      this.buildSurface()
    })

    sel = "#pRadius"
    go.radius = getFloat($(sel))
    bindOnChangeNumeric(sel, n => {
      go.radius = n
      this.buildSurface()
    })

    sel = "#pWendlandRadius"
    go.wendlandRadius = getFloat($(sel))
    bindOnChangeNumeric(sel, n => {
      go.wendlandRadius = n
      this.buildSurface()
    })

    sel = "#pClamp"
    go.clamp = getCheckbox($(sel))
    bindOnChangeCheckbox(sel, b => {
      go.clamp = b
      this.buildSurface()
    })

    sel = "#pBuildGrid"
    go.buildSurface = getCheckbox($(sel))
    bindOnChangeCheckbox(sel, b => {
      go.buildGrid = b
      this.buildGrid()
    })

    sel = "#pBuildSurface"
    go.buildSurface = getCheckbox($(sel))
    bindOnChangeCheckbox(sel, b => {
      go.buildSurface = b
      this.buildSurface()
    })

    sel = "#pBuildSurfaceMesh"
    go.buildSurfaceMesh = getCheckbox($(sel))
    bindOnChangeCheckbox(sel, b => {
      go.buildSurfaceMesh = b
      this.buildSurfaceMesh()
    })

    sel = "#pVisualizeGrid"
    bindOnChangeCheckbox(sel, b => {
      if (this.grid) this.grid.visualize(b, this.scene, this.gridMat)
    })

    sel = "#pVisualizeSurface"
    bindOnChangeCheckbox(sel, b => {
      if (this.surface) this.surface.visualize(b, this.scene, this.surfaceMat)
    })

    sel = "#pVisualizeSurfaceMesh"
    bindOnChangeCheckbox(sel, b => {
      if (this.surfaceMesh) this.surfaceMesh.visualize(b, this.scene, this.surfaceMat)
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

  buildTree() {
    this.tree = new Octree(this.vertices, this.vertMeshes, this.octreeOptions)
  }

  buildGrid() {
    if (this.grid) this.grid.destroy()

    if (!this.gridOptions.buildGrid) {
      this.buildSurface()
      return
    }

    if (!this.vertices || this.vertices.length === 0) return
    const { min, max } = TreesUtils.getExtents(this.vertices)

    console.time("-- built Grid in:")
    this.grid = new Grid(min, max, this.gridOptions)
    console.timeEnd("-- built Grid in:")

    this.grid.visualize(getCheckbox($("#pVisualizeGrid")), this.scene, this.gridMat)

    this.buildSurface()
  }

  buildSurface() {
    if (this.surface) this.surface.destroy()

    if (!this.gridOptions.buildSurface) {
      this.buildSurfaceMesh()
      return
    }

    console.time("-- built Surface in:")
    this.surface = new Surface(this.tree, this.grid)
    console.timeEnd("-- built Surface in:")

    this.surface.visualize(getCheckbox($("#pVisualizeSurface")), this.scene, this.surfaceMat)
    this.buildSurfaceMesh()
  }

  buildSurfaceMesh() {
    if (this.surfaceMesh) this.surfaceMesh.destroy()

    if (!this.gridOptions.buildSurfaceMesh) {
      return
    }

    console.time("-- built SurfaceMesh in:")
    this.surfaceMesh = this.surface.buildMesh(this.grid, this.scene)
    console.timeEnd("-- built SurfaceMesh in:")

    this.surfaceMesh.visualize(getCheckbox($("#pVisualizeSurfaceMesh")), null, this.surfaceMat)
  }

  load(file : string, asPointCloud : boolean = false) : void {
    BABYLON.SceneLoader.ImportMesh(file, "/models/", file, this.scene, (meshes : BABYLON.AbstractMesh[]) => {
      // Remove old meshes
      this.scene.meshes.forEach(m => m.dispose())
      if (this.scene.meshes.length) this.scene.meshes = []

      if (asPointCloud) {
        this.convertToPointCloud(meshes[0], this.scene, this.pointMat)
      } else {
        meshes[0].material = this.pointMat
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
      vertMeshes[i].scaling = this.pSize
    }
    this.vertMeshes = vertMeshes

    this.vertices = vertices
    this.buildTree()
    this.buildGrid()
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