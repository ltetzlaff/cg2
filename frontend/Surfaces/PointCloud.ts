import * as BABYLON from "../../node_modules/babylonjs/babylon.module"
import { IVisualizable } from "../Utils"
import { Grid } from "./Grid"

export class PointCloud implements IVisualizable {
  public visualization : BABYLON.Mesh
  public vertices : BABYLON.Vector3[]
  public normals : BABYLON.Vector3[]
  public name : string

  constructor(data : BABYLON.Mesh | BABYLON.Vector3[], name? : string) {
    this.name = name || "PointCloud"
    this.normals = []

    if (data instanceof BABYLON.Mesh) {
      this.visualization = data
      const posFlat = data.getVerticesData(BABYLON.VertexBuffer.PositionKind)
      
      const vertices : BABYLON.Vector3[] = []
      for (let i = 0, j = 0, len = posFlat.length / 3; j < len; j++, i+=3) {
        vertices[j] = new BABYLON.Vector3(posFlat[i], posFlat[i+1], posFlat[i+2])
      }
      this.vertices = vertices    
    } else {
      // Assert Vector3[]
      this.vertices = data

      // make visualization later because it requires reference to scene
    }
  }

  public visualize(show : boolean, material : BABYLON.Material, scene? : BABYLON.Scene) {
    if (this.visualization) this.visualization.isVisible = show

    if (!show) {
      return
    }

    if (!this.visualization) {
      this.visualization = new BABYLON.Mesh("surfaceVisualization", scene)
      
      const vertices = this.vertices
      const normals = this.normals
      const unitVector = new BABYLON.Vector3(1, 1, 1)

      const positionsFlat : number[] = []
      const normalsFlat : number[] = []
      
      for (let i = 0, j = 0, len = vertices.length; j < len; j++, i+=3) {
        const p = vertices[j]
        positionsFlat[i]   = p.x
        positionsFlat[i+1] = p.y
        positionsFlat[i+2] = p.z
        const n = normals[j] || unitVector
        normalsFlat[i]   = n.x
        normalsFlat[i+1] = n.y
        normalsFlat[i+2] = n.z
      }
      const vd = new BABYLON.VertexData()
      vd.positions = positionsFlat
      vd.normals = normalsFlat
      vd.uvs = []
      vd.indices = []
      vd.applyToMesh(this.visualization)
    }

    this.visualization.material = material
  }

  public destroy() {
    this.visualization.dispose()
  }

  public toTriangleMesh(grid : Grid, mesh : BABYLON.Mesh) : BABYLON.Mesh {
    // Indices
    const indices : BABYLON.IndicesArray = []
    
    const { subdivisions } = grid.gridOptions
    const xCount = grid.xCount * subdivisions
    const zCount = grid.zCount * subdivisions
  
    const pointsPerColumn = zCount + 1
    for (let x = 0; x <= xCount - 1; x++) {
      const row = x * pointsPerColumn
      for (let z = 0; z <= zCount - 1; z++) {
        // current gridCell goes +1 in x and z
        const pointX0 = row + z
        const pointZ0 = pointX0 + 1
        const pointX1 = pointX0 + pointsPerColumn
        const pointZ1 = pointX1 + 1
        indices.push(...[pointX1, pointZ0, pointX0])
        indices.push(...[pointX1, pointZ1, pointZ0])
      }
    }

    // Vertices + normals
    const vertices = this.vertices
    const normals = this.normals
    const len = vertices.length

    const positionsFlat = new Float32Array(len * 3)
    const normalsFlat = new Float32Array(len * 3)

    for (let i = 0, j = 0; j < len; j++, i += 3) {
      //points[i].toArray(vertices, j)
      const p = vertices[j]
      const n = normals[j]
      positionsFlat[i]   = p.x
      positionsFlat[i+1] = p.y
      positionsFlat[i+2] = p.z
      normalsFlat[i]   = n.x
      normalsFlat[i+1] = n.y
      normalsFlat[i+2] = n.z
    }

    // Merge
    const vertexData = new BABYLON.VertexData()
    vertexData.positions = positionsFlat
    vertexData.indices = indices
    vertexData.normals = normalsFlat
    vertexData.applyToMesh(mesh)
    return
  }
}