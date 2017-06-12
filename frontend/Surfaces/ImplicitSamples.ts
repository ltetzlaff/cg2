import { Vector3, Color4, Mesh, Scene, Material, VertexBuffer } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { IVisualizable } from "../Utils"
import { PointCloud } from "./PointCloud"
import { Grid3D } from "./Grid3D"
import { TreesUtils } from "../Trees/TreesUtils"
import { calculateMLSPoint } from "./SurfaceUtils"
import { PolynomialBasis } from "./PolynomialBasis"

export class ImplicitSamples implements IVisualizable {
  public visualization : Mesh = null

  public samples : { position: Vector3, implicitValue: number }[]
  private epsilon : number
  private inner : PointCloud
  private source : PointCloud
  private outer : PointCloud

  constructor(source : PointCloud, grid : Grid3D) {
    const isNearest = (p : Vector3, p2 : Vector3) => {
      const picked = source.tree.query(p2, TreesUtils.FindingPattern.KNearest, { k : 1 }) as Vector3[]
      return picked.length === 1 && picked[0].equals(p) 
    }

    this.source = source

    const { vertices, normals } = source
    const innerPoints : Vector3[] = []
    const outerPoints : Vector3[] = []
    
    let epsilon = Vector3.Distance(grid.min, grid.max) * .01 * 2
    vertices.forEach((p, i) => {
      let epsilonTooHigh = false
      // outward point p_i + n_i
      let pOut
      do {
        pOut = p.add(normals[i].scale(epsilon))
        epsilonTooHigh = !isNearest(p, pOut)
        if (epsilonTooHigh) epsilon *= .5        
      } while (epsilonTooHigh)
      outerPoints.push(pOut)

      // inward point p_i + n_i
      let pIn
      do {
        pIn = p.subtract(normals[i].scale(epsilon))
        epsilonTooHigh = !isNearest(p, pIn)        
        if (epsilonTooHigh) epsilon *= .5
      } while (epsilonTooHigh)
      innerPoints.push(pIn)
    })
    
    this.samples = []
    this.epsilon = epsilon
    this.inner = new PointCloud(innerPoints)
    this.outer = new PointCloud(outerPoints)
  }

  sample(grid : Grid3D) : void {
    console.log("sampling")
    const { wendlandRadius, radius, polynomialBasis } = grid.gridOptions

    this.samples = []
    let minSample = Number.MAX_VALUE

    // pick around roughly resolution sphere worked really well
    const pickingRadius = 1/(grid.gridOptions.subdivisions + 1) * grid.diagonal

    grid.iterateVertices(position => {
      const implicitValue = calculateMLSPoint(
        position, 
        pickingRadius, 
        this.source.tree, 
        PolynomialBasis[polynomialBasis](3), 
        [this.inner.vertices, this.source.vertices, this.outer.vertices],
        this.epsilon
      )

      this.samples.push({ position, implicitValue })
      if (implicitValue < minSample) minSample = implicitValue
    }, true)
    minSample = Math.abs(minSample)

    //const stretch = (n : number) => Math.abs(n)/maxSample
    const stretch = (n : number) => n / minSample

    const vertexColors : number[] = []
    this.samples.forEach((s, i) => {
      const color = new Color4(0, 0, 0, 1)
      const f = s.implicitValue
      if (f > 0) {
        color.r = stretch(f)
        color.a = .2
      } else if (f < 0) {
        color.b = 1 + stretch(f)
      } else {
        color.g = 1
      }
      color.toArray(vertexColors, i*4)    
    })
    
    grid.visualization.setVerticesData(VertexBuffer.ColorKind, vertexColors)
    grid.visualization.useVertexColors = true
    grid.visualization.hasVertexAlpha = true
  }

  public visualizeNormals(show : boolean, color : string, scene : Scene) {
    if (this.inner) this.inner.visualizeNormals(show, color, scene)
    if (this.outer) this.outer.visualizeNormals(show, color, scene)
  }

  public visualize(show : boolean, material : Material, scene? : Scene) {
    if (this.inner) this.inner.visualize(show, material, scene)
    if (this.outer) this.outer.visualize(show, material, scene)
  }

  public destroy() {
    this.visualizeNormals(false, null, null)
    this.visualize(false, null, null)
    this.inner = null
    this.outer = null
  }
}