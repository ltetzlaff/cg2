import * as BABYLON from "../../node_modules/babylonjs/babylon.module"
import { TreesUtils } from "./TreesUtils"

export class OctreeOptions {
  public bucketSize : number
  public maxDepth : number
  public pointSize : BABYLON.Vector3

  constructor(bucketSize : number, maxDepth : number, pointSize : BABYLON.Vector3) {
    this.bucketSize = bucketSize
    this.maxDepth = maxDepth
    this.pointSize = pointSize
  }
}

const DEFAULT = new OctreeOptions(5, 5, new BABYLON.Vector3(.05, .05, .05))

export class Octant extends TreesUtils.Box implements TreesUtils.IQueryable {
  private static splitsInto = 8
  public children : Octant[]
  public level : number
  public points : TreesUtils.Point[]
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
            if (octant.contains(p.box.center)) {
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

export class Octree extends Octant implements TreesUtils.Tree {
  constructor(vertices : BABYLON.Vector3[], vertMeshes : BABYLON.Mesh[], options : OctreeOptions = DEFAULT) {
    const { min, max } = TreesUtils.getExtents(vertices)
    super(min, max.subtract(min), 0, options)

    const pSize = options.pointSize || BABYLON.Vector3.Zero()
    this.points = vertices.map((p, i) => {
      return new TreesUtils.Point(new TreesUtils.Box(p.subtract(pSize.scale(.5)), pSize), vertMeshes[i] || null)
    })
    this.trySubdivide()
  }

  visualize(scene : BABYLON.Scene, container : BABYLON.Mesh[], mat : BABYLON.Material) : void {
    const viz = (octant : Octant) => {
      const s = octant.size
      const b = BABYLON.MeshBuilder.CreateBox("octant lv" + octant.level, 
        { width: s.x, height: s.y, depth: s.z }, scene)
      b.setAbsolutePosition(octant.center)
      b.material = mat
      container.push(b)

      // recurse
      octant.children.forEach(child => viz(child))
    }
    viz(this)
  }

  pick(ray : BABYLON.Ray, pattern : TreesUtils.FindingPattern = TreesUtils.FindingPattern.KNearest, options : any) : TreesUtils.Point[] {
    const hitOctants = this.findIntersecting(ray)
    if (!hitOctants) return [] // no octant hit

    const startingPointOctants = hitOctants
      .map(octant => ({ r: octant.distanceToCenter(ray.origin), octant }))
      .sort((o1, o2) => o1.r - o2.r)
      .map(o => o.octant)
    
    let sphere : TreesUtils.Sphere
    startingPointOctants.some(octant => {
      const foundInOctant = octant.points.find(p => ray.intersectsBoxMinMax(p.box.min,p.box.max))
      if (!foundInOctant) return false
      if (!(options.radius === 0 || options.radius > 0)) {
        options.radius = Number.MAX_VALUE // knearest just needs a point
      }
      sphere = new TreesUtils.Sphere(foundInOctant.box.center, options.radius)
      return true
    })

    if (!sphere) return [] // no direct box hit

    let candidates : TreesUtils.Point[] = []
    switch (pattern) {
      case TreesUtils.FindingPattern.KNearest:
        this.findIntersecting(sphere)
          .forEach(octant => {
            candidates.push(...octant.points)
            candidates = candidates
              .sort((a, b) => sphere.distanceToCenter(a.box.center) - sphere.distanceToCenter(b.box.center))
              .slice(0, options.k)
          })
        break
      case TreesUtils.FindingPattern.Radius:
        this.findIntersecting(sphere)        
          .forEach(octant => {
            candidates.push(...octant.points.filter(p => sphere.contains(p.box.center)))
          })
        break
    }
    return candidates
  }
}
