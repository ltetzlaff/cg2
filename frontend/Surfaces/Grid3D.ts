import * as BABYLON from "../../node_modules/babylonjs/babylon.module"
import { TreesUtils } from "../Trees/TreesUtils"
import { IVisualizable } from "../Utils"
import { MCAlgo } from "./MarchingCubes"

export class GridOptions {
  public buildGrid = true
  public subdivisions = 1
  public subdivideWithPolynomials = true
  public padding = 0

  public runImplicitSampling = true
  public findingPattern : TreesUtils.FindingPattern
  public radius = .1
  public k = 1
  public wendlandRadius = .2
  public clamp = false

  public buildMCMesh = true
  public mcAlgo = MCAlgo.MarchingCubes
}

export class Grid3D implements IVisualizable {
  public visualization : BABYLON.InstancedMesh[]
  private boxPrefab : BABYLON.Mesh

  public gridOptions : GridOptions
  public min : BABYLON.Vector3
  public max : BABYLON.Vector3
  public resolution : BABYLON.Vector3

  constructor(min : BABYLON.Vector3, max : BABYLON.Vector3, gridOptions : GridOptions) {
    this.gridOptions = gridOptions

    const diff = max.subtract(min)
    const pad = diff.scale(gridOptions.padding)
    this.min = min.subtract(pad)
    this.max = max.add(pad)
    this.resolution = diff
      .scale(1 + 2 * gridOptions.padding)
      .scale(1/gridOptions.subdivisions)
    console.log(this.gridOptions.subdivisions)
  }

  visualize(show : boolean, material : BABYLON.Material, scene: BABYLON.Scene) {
    const v = this.visualization
    if (v && v.length !== 0) v.forEach(m => m.dispose())
    
    if (!show) return

    const r = this.resolution          
    if (!this.boxPrefab) {
      const box = BABYLON.MeshBuilder.CreateBox("Grid3D", {
        width: r.x, height: r.y, depth: r.z
      }, scene)
      box.material = material
      box.isVisible = false
      this.boxPrefab = box
    }

    this.visualization = []
    this.iterateVertices(v => {
      const cell = this.boxPrefab.createInstance("gridCell")
      const cellPosition = v.add(r.scale(.5)) // absolute position goes from center
      cell.setAbsolutePosition(cellPosition)
      this.visualization.push(cell)
    }, false)
  }

  iterateVertices(cb : (v : BABYLON.Vector3) => void, doLastRow = true) {
    const res = this.resolution
    const min = this.min
    this.iterateIndices((x, y, z) => {
      const vertex = res.multiplyByFloats(x, y, z).add(min)
      cb(vertex)
    }, doLastRow)
  }

  iterateIndices(cb : (x : number, y : number, z : number) => void, doLastRow = true) {
    const o = doLastRow ? 1 : 0
    const N = this.gridOptions.subdivisions + o
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
        for (let z = 0; z < N; z++) {
          cb(x, y, z)
        }
      }
    }
  }

  destroy() {
    this.visualize(false, null, null)
  }
}
