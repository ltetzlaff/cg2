import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import { IVisualizable } from "./Utils"
import { Grid } from "./Grid"

export class PointCloud implements IVisualizable {
  public visualization : BABYLON.Mesh
  public vertices : BABYLON.Vector3[]
  public name : string

  constructor(mesh : BABYLON.AbstractMesh | BABYLON.Mesh, name? : string) {
    this.name = name || "PointCloud"
    this.visualization = mesh as BABYLON.Mesh
    const vertexCoordinates = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)

    if (vertexCoordinates.length % 3 !== 0) {
      throw new RangeError("Vertices array doesn't seem to consist of Vector3s")
    }

    const vertCount = vertexCoordinates.length / 3
    const vertices : BABYLON.Vector3[] = []
    for (let i = 0; i < vertCount; i++) {
      let j = i * 3
      vertices[i] = new BABYLON.Vector3(vertexCoordinates[j], vertexCoordinates[j+1], vertexCoordinates[j+2])
    }
    this.vertices = vertices
  }

  public visualize(show : boolean, material : BABYLON.Material, _scene? : BABYLON.Scene) {
    this.visualization.isVisible = show

    if (!show) {
      return
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

    // Vertices
    const vertices = this.vertices
    const len = vertices.length
    const positions = new Float32Array(len * 3)
    for (let i = 0, j = 0; i < len; i++, j += 3) {
      //points[i].toArray(vertices, j)
      const p = vertices[i]
      positions[j] = p.x
      positions[j+1] = p.y
      positions[j+2] = p.z
    }

    // Merge
    const vertexData = new BABYLON.VertexData()
    vertexData.positions = positions
    vertexData.indices = indices
    vertexData.applyToMesh(mesh)
    return
  }
}