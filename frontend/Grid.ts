import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import { TreesUtils } from "./Trees/TreesUtils"
import { IVisualizable } from "./Utils"

export class GridOptions {
  public buildGrid = true
  public resolution = 1
  public subdivisions = 1

  public buildSurface = false
  public findingPattern : TreesUtils.FindingPattern
  public radius = .1
  public k = 1

  public buildSurfaceMesh = false
  public wendlandRadius = .2
  public clamp = false
}

export class Grid implements IVisualizable {
  public visualization : BABYLON.Mesh

  public gridOptions : GridOptions
  public min : BABYLON.Vector3
  public max : BABYLON.Vector3
  public xCount : number
  public zCount : number
  public xResolution : number
  public zResolution : number
  private yHalf : number
 
  constructor(min : BABYLON.Vector3, max : BABYLON.Vector3, gridOptions : GridOptions) {
    this.gridOptions = gridOptions
    this.min = min
    this.max = max

    const diff = max.subtract(min)
    this.xCount = Math.floor(diff.x/gridOptions.resolution)
    this.xResolution = diff.x/this.xCount

    this.zCount = Math.floor(diff.z/gridOptions.resolution)
    this.zResolution = diff.z/this.zCount
  }

  visualize(show : boolean, material : BABYLON.Material, scene?: BABYLON.Scene) {
    if (!show) {
      if (this.visualization) this.visualization.dispose()
      return
    }

    const plane = BABYLON.MeshBuilder.CreateTiledGround("grid", {
      xmin: this.min.x, xmax: this.max.x,
      zmin: this.min.z, zmax: this.max.z,
      subdivisions: { w: this.xCount, h: this.zCount }
    }, scene)
    plane.position.y = this.min.y
    plane.material = material
    this.visualization = plane
  }

  destroy() {
    this.visualize(false, null, null)
  }
}
