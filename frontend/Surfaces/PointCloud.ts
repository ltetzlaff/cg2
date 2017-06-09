import { Vector3, Mesh, Color3, Scene, Material, IndicesArray, VertexData } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { IVisualizable, showVertexNormals, getVertexData } from "../Utils"
import { Grid3D } from "./Grid3D"
import { Octree, OctreeOptions } from "../Trees/Octree"

export class PointCloud implements IVisualizable {
  public visualization : Mesh
  public normalVisualization : Mesh
  public vertices : Vector3[]
  public normals : Vector3[]
  public name : string

  public tree : Octree

  constructor(data : Mesh | Vector3[], name? : string, scale = 1) {
    this.name = name || "PointCloud"
    this.normals = []

    if (data instanceof Mesh) {
      const { positions, normals } = getVertexData(data)
      this.vertices = positions
      this.normals = normals
    } else {
      // Assert Vector3[]
      this.vertices = data
    }

    if (scale !== 1) {
      this.vertices.forEach(v => v.scaleInPlace(scale))
    }

    const opts = new OctreeOptions(60, 5)    
    this.tree = new Octree(this.vertices, opts)
  }

  public visualizeNormals(show : boolean, color : string, scene : Scene) {
    if (this.normalVisualization) this.normalVisualization.dispose()
    if (!show) return
    
    const ls = showVertexNormals(this.vertices, this.normals, scene, color)
    this.normalVisualization = ls
  }

  public visualize(show : boolean, material : Material, scene : Scene) {
    if (this.visualization) this.visualization.isVisible = show

    if (!show) {
      return
    }

    if (!this.visualization) {
      this.visualization = new Mesh("surfaceVisualization", scene)
      
      const vertices = this.vertices
      const normals = this.normals
      const unitVector = new Vector3(1, 1, 1)

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
      const vd = new VertexData()
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

  public toTriangleMesh(Grid3D : Grid3D, mesh : Mesh) : Mesh {
    // Indices
    const indices : IndicesArray = []
    
    const { subdivisions } = Grid3D.gridOptions
    
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
    const vertexData = new VertexData()
    vertexData.positions = positionsFlat
    vertexData.indices = indices
    vertexData.normals = normalsFlat
    vertexData.applyToMesh(mesh)
    return
  }
}