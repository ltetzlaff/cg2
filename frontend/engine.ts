import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import { TreesUtils } from "./Trees/TreesUtils"
import "./OFFFileLoader"

class GridOptions {
  public resolution : number
  public radius : number
  public subdivisions : number

  constructor() {
    this.resolution = 1
    this.radius = 1
    this.subdivisions = 0
  }
}

export class Engine {
  private canvas : HTMLCanvasElement
  private engine: BABYLON.Engine
  public scene : BABYLON.Scene
  private loader : BABYLON.AssetsManager
  private sun: BABYLON.Light
  private cam : BABYLON.ArcRotateCamera

  private vertices : BABYLON.Vector3[]
  private vertMeshes : BABYLON.InstancedMesh[]
  private wfMat : BABYLON.Material
  private wfMatGrid : BABYLON.Material
  private gridOptions : GridOptions
  private grid : BABYLON.Mesh

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

    this.vertices = []
    this.wfMat = new WireFrameMaterial(BABYLON.Color3.Red(), this.scene)
    this.wfMatGrid = new WireFrameMaterial(BABYLON.Color3.Blue(), this.scene)
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

    this.gridOptions.resolution = getFloat($("#pResolution"))
    bindOnChangeNumeric("#pResolution", n => {
      this.gridOptions.resolution = n
    })

    bindOnChangeFile("#load", fl => {
      this.load(fl[0].name, true)
    })
    
    window.addEventListener("keydown", ev => {
      if (ev.keyCode == 107 || ev.keyCode == 87) this.cam.radius -= .1
      if (ev.keyCode == 106 || ev.keyCode == 83) this.cam.radius += .1
    })
  }

  buildSurface() {
    const { min, max } = TreesUtils.getExtents(this.vertices)
    max.y = min.y
    
    const xDist = max.x - min.x
    const xCount = Math.floor(xDist/this.gridOptions.resolution)
    const xResolution = xDist/xCount
    
    const zDist = max.z - min.z
    const zCount = Math.floor(zDist/this.gridOptions.resolution)
    const zResolution = zDist/zCount

    if (this.grid) this.grid.dispose()
    const plane = BABYLON.MeshBuilder.CreateTiledGround("grid", {
      xmin: min.x, xmax: max.x,
      zmin: min.z, zmax: max.z,
      subdivisions: { w: xCount, h: zCount }
    }, this.scene)
    plane.material = this.wfMatGrid
    this.grid = plane

    for (let x = 0; x < xCount; x++) {
      for (let z = 0; z < zCount; z++) {
        /*
          min.x + x*xResolution,
          min.y,
          min.z + z*zResolution
        */
      }
    }
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
    const s = .01
    for (let i = 0; i < vertCount; i++) {
      let j = i * 3
      vertices[i] = new BABYLON.Vector3(vertexCoordinates[j], vertexCoordinates[j+1], vertexCoordinates[j+2])
      vertMeshes[i] = vertMesh.createInstance("v" + i)
      vertMeshes[i].setAbsolutePosition(vertices[i])
      vertMeshes[i].scaling = new BABYLON.Vector3(s,s,s)
    }
    this.vertMeshes = vertMeshes

    //scene.meshes.push(...vertMeshes) 
    this.vertices = vertices
    this.buildSurface()
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