import * as BABYLON from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { TreesUtils } from "../Trees/TreesUtils"
import { IVisualizable } from "../Utils"
import { PointCloud } from "./PointCloud"
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
  public visualization : BABYLON.Mesh

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
  }

  visualize(show : boolean, material : BABYLON.Material, scene: BABYLON.Scene) {
    if (this.visualization) this.visualization.isVisible = show

    if (!show) {
      return
    }

    if (!this.visualization) {
      this.visualization = new BABYLON.Mesh("surfaceVisualization", scene)
      
      const unitVector = new BABYLON.Vector3(1, 1, 1)
      const positionsFlat : number[] = []
      const normalsFlat : number[] = []
      
      this.iterateVertices((p, j) => {
        const i = j*3
        positionsFlat[i]   = p.x
        positionsFlat[i+1] = p.y
        positionsFlat[i+2] = p.z
        const n = unitVector
        normalsFlat[i]   = n.x
        normalsFlat[i+1] = n.y
        normalsFlat[i+2] = n.z
      }, true)
      
      const vd = new BABYLON.VertexData()
      vd.positions = positionsFlat
      vd.normals = normalsFlat
      vd.uvs = []
      vd.indices = []
      vd.applyToMesh(this.visualization)
    }

    this.visualization.material = material
  }

  iterateVertices(cb : (v : BABYLON.Vector3, i? : number) => void, doLastRow = true) {
    const res = this.resolution
    const min = this.min
    this.iterateIndices((x, y, z, i) => {
      const vertex = res.multiplyByFloats(x, y, z).add(min)
      cb(vertex, i)
    }, doLastRow)
  }

  iterateIndices(cb : (x : number, y : number, z : number, i? : number) => void, doLastRow = true) {
    const o = doLastRow ? 1 : 0
    const N = this.gridOptions.subdivisions + o
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
        for (let z = 0; z < N; z++) {
          cb(x, y, z, x*N*N + y*N + z)
        }
      }
    }
  }

  destroy() {
    this.visualize(false, null, null)
  }
}
