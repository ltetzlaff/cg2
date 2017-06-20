import { Vector3, Mesh, Scene, Material, IndicesArray, VertexData, MathTools } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { Vertex, IVisualizable, showVertexNormals, getVertexData } from "../Utils"
import { PointsOfCube, EdgesOfCube, EdgesMask, FacesMask } from "./Triangulation"
import { ImplicitSamples } from "./ImplicitSamples"
import { Grid3D } from "./Grid3D"

export enum MCAlgo {
  MarchingCubes, EnhancedMarchingCubes
}

export class MCMesh implements IVisualizable {
  public visualization : Mesh
  public normalVisualization : Mesh
  
  private vertices : Vertex[]
  private indices : number[]

  constructor(implicitSamples : ImplicitSamples, grid : Grid3D) {
    const defaultVector = new Vector3(-1, -1, -1)

    this.vertices = []
    this.indices = []
    
    const { samples } = implicitSamples
    
    // Get Index for Sample Lookup    
    const dim = grid.gridOptions.subdivisions + 1    
    const index = (ind : Vector3, offset : Vector3) => {
      return (ind.x + offset.x)*dim * dim + (ind.y + offset.y)*dim+ ind.z + offset.z
    }

    grid.iterateIndices((x, y, z) => {
      if (z === dim - 1 || y === dim - 1 || x === dim - 1) return

      // Find Cube Points and Cube Pattern Index       
      let cubePatternIndex = 0 // lookup index for the pattern-bitmask
      const cubePoints = PointsOfCube.map((o, n) => {
        const i = index(new Vector3(x, y, z), o)
        const s = samples[i]
        if (s.implicitValue < 0) cubePatternIndex |= (2 ** n)
        return s
      })

      // Add Vertices
      const corners : Vector3[] = []          
      for (let i = 0; i < 12; i++) {
        if (!(EdgesMask[cubePatternIndex] & 2 ** i)) {
          corners.push(defaultVector)
          continue
        }
        
        const edge = EdgesOfCube[i]

        // Lerp
        const a = cubePoints[edge.x]
        const b = cubePoints[edge.y]
        
        let vertex : Vector3
        const divisor = b.implicitValue - a.implicitValue
        const t = Math.abs(divisor) > .001 ? -a.implicitValue/divisor : 0
        vertex = Vector3.Lerp(a.position, b.position, t)
        corners.push(vertex)
      }

      // Get Cube's Triangulation Pattern
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
    })
  }

  public visualizeNormals(show : boolean, color : string, scene : Scene) {
    if (this.normalVisualization) this.normalVisualization.dispose()
    if (!show) return
    
    const ls = showVertexNormals(this.vertices, scene, color)
    this.normalVisualization = ls
  }

  public visualize(show : boolean, material : Material, scene : Scene) {
    if (this.visualization) this.visualization.isVisible = show
    if (!show) return

    if (!this.visualization) {
      this.visualization = new Mesh("surfaceVisualization", scene)

      const vd = getVertexData(this.vertices)
      vd.indices = this.indices
      vd.applyToMesh(this.visualization)
      this.visualization.convertToFlatShadedMesh()
    }

    this.visualization.material = material
  }

  public destroy() {
    if (this.visualization) this.visualization.dispose()
    if (this.normalVisualization) this.normalVisualization.dispose()
  }
}