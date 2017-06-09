import { Vector3, Color4, Mesh, Scene, Material, VertexBuffer } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { IVisualizable } from "../Utils"
import { PointCloud } from "./PointCloud"
import { Grid3D } from "./Grid3D"
import { TreesUtils } from "../Trees/TreesUtils"
import { calculateMLSPoint } from "./SurfaceUtils"
import { PolynomialBasis } from "./PolynomialBasis"

export class ImplicitSamples implements IVisualizable {
  public visualization : Mesh = null

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
    
    this.epsilon = epsilon
    this.inner = new PointCloud(innerPoints)
    this.outer = new PointCloud(outerPoints)
  }

  sample(grid : Grid3D) : void {
    console.log("sampling")
    const { wendlandRadius, radius } = grid.gridOptions

    const samples : number[] = []
    let maxSample = -Number.MAX_VALUE
    grid.iterateVertices((position, i) => {
      const implicitValue = calculateMLSPoint(
        position, 
        wendlandRadius,
        radius,
        this.source.tree, 
        PolynomialBasis.Constant(3), 
        [this.inner.vertices, this.source.vertices, this.outer.vertices],
        this.epsilon
      )

      samples.push(implicitValue)
      if (implicitValue > maxSample) maxSample = implicitValue
      /* #DEBUG
      color.r = 1
      color.g = .2
      color.b = .5
      */
      //console.log(implicitValue.toFixed(4), this.epsilon.toFixed(4))
    })

    const stretch = (n : number) => (n/maxSample)

    const vertexColors : number[] = []
    samples.forEach((s, i) => {
      const color = new Color4(0, 0, 0, 1)
      if (s < 0) {
        color.r = stretch(s)
        color.a = .1
      } else if (s > 0) {
        color.b = stretch(s)
      } else {
        color.g = 1
      }
      //console.log(color)
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