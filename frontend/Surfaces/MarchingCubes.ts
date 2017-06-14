import { Vector3, Mesh, Scene, Material, IndicesArray, VertexData, MathTools } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { IVisualizable, showVertexNormals, getVertexData } from "../Utils"
import { PointsOfCube, EdgesOfCube, EdgesMask, FacesMask } from "./Triangulation"
import { ImplicitSamples } from "./ImplicitSamples"
import { Vertex } from "../Trees/TreesUtils"

export enum MCAlgo {
  MarchingCubes, EnhancedMarchingCubes
}

export class MCMesh implements IVisualizable {
  public visualization : Mesh
  public normalVisualization : Mesh
  
  private vertices : Vertex[]
  private indices : number[]

  constructor(implicitSamples : ImplicitSamples) {
    const defaultVector = new Vector3(-1, -1, -1)

    this.vertices = []
    this.indices = []
    
    const { samples } = implicitSamples
    const dim = (Math.pow(samples.length, 1/3) | 0) // third root
    //console.log("dim:", dim, "samples:", samples.length)
    
    for (let x = 0; x < dim; x++) {
      for (let y = 0; y < dim; y++) {
        for (let z = 0; z < dim; z++) {
          // Get Index for Sample Lookup
          const index = (offset : Vector3) => {
            return (((x + offset.x) * (dim + 1)) + y + offset.y) * (dim + 1) + z + offset.z
          }

          // Find Cube Points and Cube Pattern Index       
          let cubePatternIndex = 0 // lookup index for the pattern-bitmask
          const cubePoints = PointsOfCube.map((o, i) => {
            //console.log("index" + i + ":", index(o))
            
            const s = samples[index(o)]
            if (s.implicitValue < 0) cubePatternIndex |= (i ** 2)
            return s
          })

          // Add Vertices
          const corners : Vector3[] = []          
          for (let i = 0; i < 12; i++) {
            if (!(EdgesMask[cubePatternIndex] & i ** 2)) {
              corners.push(defaultVector)
              continue
            }
            
            const edge = EdgesOfCube[i]

            // Lerp
            const a = cubePoints[edge.x]
            const b = cubePoints[edge.y]
            
            let vertex : Vector3
            const divisor = b.implicitValue - a.implicitValue
            const t = MathTools.Clamp(-a.implicitValue/divisor, 0, 1)
            //const t = Math.abs(divisor) > .1 ? -a.implicitValue/divisor : 0
            vertex = Vector3.Lerp(a.position, b.position, t)
            corners.push(vertex)
          }

          // Get Cube's Triangulation Pattern
          //console.log(cubePatternIndex)
          const cubePattern = FacesMask[cubePatternIndex]
          const indexOffset = this.vertices.length

          // Loop Triangles in Marching Cube Cell
          for(let i = 0; i < 12; i += 3) {
            // Loop Verts in Triangle
            for (let j = 0; j < 3; j++) {
              const index = cubePattern[i + j]
              if (index === -1) break
              this.indices.push(this.vertices.length)              
              this.vertices.push(new Vertex(corners[index]))
            }            
          }
        }
      }
    }

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
      //console.log(this.vertices, this.indices)

      const vd = getVertexData(this.vertices)
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