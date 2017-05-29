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
      .scale(gridOptions.subdivisions)
  }

  visualize(show : boolean, material : BABYLON.Material, scene?: BABYLON.Scene) {
    if (!show) {
      if (this.visualization) this.visualization.dispose()
      return
    }

    const N = this.gridOptions.subdivisions
    const plane = BABYLON.MeshBuilder.CreateTiledGround("Grid3D", {
      xmin: this.min.x, xmax: this.max.x,
      zmin: this.min.z, zmax: this.max.z,
      subdivisions: { w: N, h: N }
    }, scene)
    plane.position.y = this.min.y
    plane.material = material
    this.visualization = plane
  }

  iterate(cb : (x : number, y : number, z : number) => void) {
    const N = this.gridOptions.subdivisions
    for (let x = 0; x <= N; x++) {
      for (let y = 0; y <= N; y++) {
        for (let z = 0; z <= N; z++) {
          cb(x, y, z)
        }
      }
    }
  }

  destroy() {
    this.visualize(false, null, null)
  }
}
