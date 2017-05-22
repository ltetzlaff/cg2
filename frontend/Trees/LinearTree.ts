import * as BABYLON from "../../node_modules/babylonjs/babylon.module"
import { TreesUtils } from "./TreesUtils"
import { Tree } from "./Tree"

export class LinearTree implements Tree {
  public children : any[]
  public points : TreesUtils.Point[]

  constructor(vertices : BABYLON.Vector3[], pointSize : BABYLON.Vector3= BABYLON.Vector3.Zero()) {
    this.children = []

    this.points = vertices.map((p, i) => {
      return new TreesUtils.Point(new TreesUtils.Box(p.subtract(pointSize.scale(.5)), pointSize))
    })
  }
  
  pick(ray : BABYLON.Ray, pattern : TreesUtils.FindingPattern, options : any) : TreesUtils.Point[] {
    const startingPoint = this.points.find(p => ray.intersectsBoxMinMax(p.box.min,p.box.max))
    if (!startingPoint) return []
    
    this.query(startingPoint.box.center, pattern, options)
  }

  query(startingPoint : BABYLON.Vector3, pattern : TreesUtils.FindingPattern, options : any) : TreesUtils.Point[] {
    if (!(options.radius === 0 || options.radius > 0)) {
      options.radius = Number.MAX_VALUE // knearest just needs a point
    }
    const sphere = new TreesUtils.Sphere(startingPoint, options.radius)

    switch (pattern) {
      case TreesUtils.FindingPattern.KNearest:
        return this.points
          .sort((a, b) => sphere.distanceToCenter(a.box.center) - sphere.distanceToCenter(b.box.center))
          .slice(0, options.k)
      case TreesUtils.FindingPattern.Radius:
        return this.points.filter(p => sphere.contains(p.box.center))
      default:
        throw new TypeError("Unknown FindingPattern:" + pattern)
    }
  }

  visualize(scene : BABYLON.Scene, container : BABYLON.Mesh[], mat : BABYLON.Material) : void {
  }
}