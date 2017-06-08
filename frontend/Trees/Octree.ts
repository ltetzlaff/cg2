import * as BABYLON from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { TreesUtils } from "./TreesUtils"
import { Tree } from "./Tree"
import { IVisualizable, getExtents } from "../Utils"

export class OctreeOptions {
  public bucketSize : number
  public maxDepth : number

  constructor(bucketSize : number, maxDepth : number) {
    this.bucketSize = bucketSize
    this.maxDepth = maxDepth
  }
}

export class Octant extends TreesUtils.Box implements TreesUtils.IQueryable {
  private static splitsInto = 8
  public children : Octant[]
  public points : BABYLON.Vector3[]
  public level : number
  private options : OctreeOptions

  constructor(min : BABYLON.Vector3, size : BABYLON.Vector3, level : number, options : OctreeOptions) {
    super(min, size)
    this.level = level
    this.children = []
    this.points = []
    this.options = options
  }

  findIntersecting(x : any) : Octant[] {
    let b = false
    if (x instanceof BABYLON.Ray) {
      b = (x as BABYLON.Ray).intersectsBoxMinMax(this.min, this.max)
    } else if (x instanceof TreesUtils.Sphere) {
      const s = x as TreesUtils.Sphere
      b = BABYLON.BoundingBox.IntersectsSphere(this.min, this.max, s.center, s.radius)
    } else if (x instanceof TreesUtils.Cylinder) {
      const c = x as TreesUtils.Cylinder
      b = c.intersectsBoxMinMax(this.min, this.max)
    } else if (x instanceof TreesUtils.Tube) {
      const t = x as TreesUtils.Tube
      b = TreesUtils.rectInCircle(this.min, this.max, t.center.x, t.center.y, t.radius)
      //b = t.intersectsBoxMinMax(this.min, this.max)
    } else {
      throw new TypeError("Cannot find Intersection with type: " + x.constructor.name + JSON.stringify(x))
    }

    const ret : Octant[] = []

    if (b) {
      if (this.children.length === 0) {
        ret.push(this)
      } else {
        this.children.forEach(child => ret.push(...child.findIntersecting(x)))
      }
    }
    return ret
  }


  trySubdivide() {
    if (this.level === this.options.maxDepth || this.points.length <= this.options.bucketSize) {
      return
    }

    const power = Math.log(Octant.splitsInto)/Math.log(2) - 1
    const half = this.size.scale(.5)
    for (let x = 0; x < power; x++) {
      for (let y = 0; y < power; y++) {
        for (let z = 0; z < power; z++) {
          const offset = new BABYLON.Vector3(x * half.x, y * half.y, z * half.z)
          const min = this.min.add(offset)

          const octant = new Octant(min, half, this.level + 1, this.options)
          this.children.push(octant)
          this.points = this.points.filter(p => {
            if (octant.contains(p)) {
              octant.points.push(p)
              return false
            }
            return true
          })
          octant.trySubdivide()
        }
      }
    }
  }
}

export class Octree extends Octant implements Tree, IVisualizable {
  public visualization : BABYLON.Mesh[]

  constructor(vertices : BABYLON.Vector3[], options : OctreeOptions) {
    let { min, max } = getExtents(vertices, true)
    super(min, max.subtract(min), 0, options)

    this.visualization = []
    this.points = vertices
    this.trySubdivide()
  }

  visualize(show : boolean, mat : BABYLON.Material, scene?: BABYLON.Scene) : void {
    if (!show) {
      this.visualization.forEach(m => m.dispose())
      this.visualization = []
      return
    }

    const viz = (octant : Octant) => {
      const s = octant.size
      const b = BABYLON.MeshBuilder.CreateBox("octant lv" + octant.level,
        { width: s.x, height: s.y, depth: s.z }, scene)
      b.setAbsolutePosition(octant.center)
      b.material = mat
      this.visualization.push(b)

      // recurse
      octant.children.forEach(child => viz(child))
    }
    viz(this)
  }

  destroy() {
    this.visualize(false, null, null)
  }

  pick(ray : BABYLON.Ray, pattern : TreesUtils.FindingPattern, options : any) : BABYLON.Vector3[] {
    //console.time("  - finding Start")
    const hitOctants = this.findIntersecting(ray)
    if (!hitOctants) return [] // no octant hit

    const startingPointOctants = hitOctants
      .map(octant => ({ r: octant.distanceToCenter(ray.origin), octant }))
      .sort((o1, o2) => o1.r - o2.r)
      .map(o => o.octant)

    const e = .01
    const epsilon = new BABYLON.Vector3(e, e, e)

    let startingPoint : BABYLON.Vector3
    startingPointOctants.some(octant => {
      const foundInOctant = octant.points.find(p => {
        return ray.intersectsBoxMinMax(p.subtract(epsilon),p.add(epsilon))
      })
      if (!foundInOctant) return false
      startingPoint = foundInOctant
      return true
    })
    //console.timeEnd("  - finding Start")
    if (!startingPoint) return [] // no direct box hit
    return this.query(startingPoint, pattern, options) as BABYLON.Vector3[]
  }

  query(startingPoint : BABYLON.Vector3 | BABYLON.Vector2, pattern : TreesUtils.FindingPattern, options : any) : BABYLON.Vector3[] | number[] {
    if (pattern === TreesUtils.FindingPattern.KNearest) {
      options.radius = Number.MAX_VALUE // knearest just needs a point
    }

    let intersectedOctants : Octant[] = []
    let volume : TreesUtils.IVolume
    if (startingPoint instanceof BABYLON.Vector3) {
      // classic point query
      volume = new TreesUtils.Sphere(startingPoint, options.radius)
    } else if (startingPoint instanceof BABYLON.Vector2) {
      // cylindrical query
      volume = new TreesUtils.Tube(startingPoint, options.radius)
    }
    intersectedOctants = this.findIntersecting(volume)

    //console.time("  - finding Query")
    let candidates : { p: BABYLON.Vector3, i: number}[] = []
    switch (pattern) {
      case TreesUtils.FindingPattern.KNearest:
        intersectedOctants.forEach(octant => {
          candidates.push(...octant.points.map((p, i) => ({ p, i })))            
        })
        candidates = candidates
          .sort((a, b) => volume.distanceToCenter(a.p) - volume.distanceToCenter(b.p))
          .slice(0, options.k)
        break
      case TreesUtils.FindingPattern.Radius:
        intersectedOctants.forEach(octant => {
          octant.points.forEach((p, i) => {
            if (volume.contains(p)) candidates.push({ p, i })
          })
        })
        break
    }
    //console.timeEnd("  - finding Query")
    if (options.justIndices) {
      return candidates.map(c => c.i)
    } else {
      return candidates.map(c => c.p)
    }
  }
}
