import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import { TreesUtils } from "./Trees/TreesUtils"
import { IVisualizable } from "./Utils"

export function PointCloudToVertexData(grid : Grid, points : BABYLON.Vector3[]) : BABYLON.VertexData {
  // Indices
  const faces : BABYLON.IndicesArray = []
  const { xCount, zCount } = grid
  const pointsPerColumn = zCount + 1
  for (let x = 0; x <= xCount - 1; x++) {
    const row = x * pointsPerColumn
    for (let z = 0; z <= zCount - 1; z++) {
      // current gridCell goes +1 in x and z
      const pointX0 = row + z
      const pointZ0 = pointX0 + 1
      const pointX1 = pointX0 + pointsPerColumn
      const pointZ1 = pointX1 + 1
      faces.push(...[pointX0, pointZ0, pointX1])
      faces.push(...[pointZ0, pointX1, pointZ1])
    }
  }

  // Vertices
  const len = points.length
  const vertices = new Float32Array(len * 3)
  for (let i = 0, j = 0; i < len; i++, j += 3) {
    //points[i].toArray(vertices, j)
    const p = points[i]
    vertices[j] = p.x
    vertices[j+1] = p.y
    vertices[j+2] = p.z
  }

  // Merge
  const vertexData = new BABYLON.VertexData()
  vertexData.positions = vertices
  vertexData.indices = faces
  return vertexData
}

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

  visualize(show : boolean, scene : BABYLON.Scene, material : BABYLON.Material) {
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
