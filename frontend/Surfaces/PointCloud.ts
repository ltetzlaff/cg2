import { Vector3, Mesh, Color3, Scene, Material, IndicesArray, VertexData } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { IVisualizable, showVertexNormals, getVertices, getVertexData } from "../Utils"
import { Grid3D } from "./Grid3D"
import { Octree, OctreeOptions } from "../Trees/Octree"
import { Vertex } from "../Trees/TreesUtils"

export class PointCloud implements IVisualizable {
  public visualization : Mesh
  public normalVisualization : Mesh
  public vertices : Vertex[]
  public name : string

  public tree : Octree

  constructor(data : Mesh | Vector3[], name? : string, scale = 1) {
    this.name = name || "PointCloud"
    
    if (data instanceof Mesh) {
      this.vertices = getVertices(data)
    } else {
      // Assert Vector3[]
      this.vertices = data.map(p => new Vertex(p))
    }

    if (scale !== 1) {
      this.vertices.forEach(v => v.position.scaleInPlace(scale))
    }

    const opts = new OctreeOptions(60, 5)    
    this.tree = new Octree(this.vertices, opts)
  }

  public visualizeNormals(show : boolean, color : string, scene : Scene) {
    if (this.normalVisualization) this.normalVisualization.dispose()
    if (!show) return
    
    const ls = showVertexNormals(this.vertices, scene, color)
    this.normalVisualization = ls
  }

  public visualize(show : boolean, material : Material, scene : Scene) {
    if (this.visualization) this.visualization.isVisible = show

    if (!show) {
      return
    }

    if (!this.visualization) {
      this.visualization = new Mesh("surfaceVisualization", scene)
      const vd = getVertexData(this.vertices)
      vd.applyToMesh(this.visualization)
    }

    this.visualization.material = material
  }

  public destroy() {
    if (this.visualization) this.visualization.dispose()
    if (this.normalVisualization) this.normalVisualization.dispose()
  }

  public toTriangleMesh(grid : Grid3D, mesh : Mesh) : Mesh {
    // Indices
    const indices : IndicesArray = []
    const { subdivisions } = grid.gridOptions
    
    const pointsPerColumn = subdivisions + 1
    for (let x = 0; x <= subdivisions - 1; x++) {
      const row = x * pointsPerColumn
      for (let z = 0; z <= subdivisions - 1; z++) {
        // current gridCell goes +1 in x and z
        const pointX0 = row + z
        const pointZ0 = pointX0 + 1
        const pointX1 = pointX0 + pointsPerColumn
        const pointZ1 = pointX1 + 1
        indices.push(...[pointX1, pointZ0, pointX0])
        indices.push(...[pointX1, pointZ1, pointZ0])
      }
    }

    const vd = getVertexData(this.vertices)
    vd.indices = indices
    vd.applyToMesh(mesh)
    return
  }
}