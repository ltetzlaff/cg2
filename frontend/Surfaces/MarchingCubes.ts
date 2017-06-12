import { Vector3, Mesh, Scene, Material, IndicesArray, VertexData } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { IVisualizable, showVertexNormals } from "../Utils"
import { PointsOrder, Edges, Pattern, EdgeOrder } from "./Triangulation"
import { ImplicitSamples } from "./ImplicitSamples"

export enum MCAlgo {
  MarchingCubes, EnhancedMarchingCubes
}

export class MCMesh implements IVisualizable {
  public visualization : Mesh
  public normalVisualization : Mesh
  
  private vertices : Vector3[]
  private normals : Vector3[]
  private indices : IndicesArray

  constructor(implicitSamples : ImplicitSamples) {
    this.vertices = []
    this.normals = []
    this.indices = []
    
    const { samples } = implicitSamples
    const dim = Math.pow(samples.length, 1/3) // third root
    
    for (let x = 0; x < dim; x++) {
      for (let y = 0; y < dim; y++) {
        for (let z = 0; z < dim; z++) {
          // Get Index for Sample Lookup
          const index = (offset : Vector3) => {
            return (((x + offset.x) * dim) + y + offset.y) * dim + z + offset.z
          }

          // Find Cube Points and Cube Pattern Index       
          let cubePatternIndex = 0 // lookup index for the pattern-bitmask
          const cubePoints = PointsOrder.map((o, i) => {
            const s = samples[index(o)]
            if (s.implicitValue <= 0) cubePatternIndex |= i ** 2
            return s
          })

          const indexOffset = this.vertices.length // save this

          // Add Vertices
          for (let i = 0; i < 12; i++) {
            if (!(Edges[cubePatternIndex] & i ** 2)) continue
            
            const edge = EdgeOrder[i]

            // Lerp
            const a = cubePoints[edge.x]
            const b = cubePoints[edge.y]
            const t = -a.implicitValue/(b.implicitValue - a.implicitValue)
            const vertex = Vector3.Lerp(a.position, b.position, t)
            this.vertices.push(vertex)
          }

          // Get Cube's Triangulation Pattern
          const cubePattern = Pattern[cubePatternIndex]

          for(let i = 0; i < 12; i++) {
            const index = cubePattern[i]
            if (index === -1) break
            this.indices.push(index + indexOffset)
          }
        }
      }
    }

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
      vd.indices = this.indices
      vd.applyToMesh(this.visualization)
    }

    this.visualization.material = material
  }

  public destroy() {
    if (this.visualization) this.visualization.dispose()
    if (this.normalVisualization) this.normalVisualization.dispose()
  }
}