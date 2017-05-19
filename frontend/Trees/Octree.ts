import * as BABYLON from "../../node_modules/babylonjs/babylon.module"
import { TreesUtils } from "./TreesUtils"
import { Tree } from "./Tree"
import { IVisualizable } from "../Utils"

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
  public points : TreesUtils.Point[]
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

export class Octree extends Octant implements Tree, IVisualizable {
  public visualization : BABYLON.Mesh[]

  constructor(vertices : BABYLON.Vector3[], vertMeshes : BABYLON.InstancedMesh[], options : OctreeOptions = DEFAULT) {
    let { min, max } = TreesUtils.getExtents(vertices, true)
    super(min, max.subtract(min), 0, options)

    this.visualization = []

    const pSize = options.pointSize
    this.points = vertices.map((p, i) => {
      if (vertMeshes[i]) vertMeshes[i].scaling = pSize
      return new TreesUtils.Point(new TreesUtils.Box(p.subtract(pSize.scale(.5)), pSize), vertMeshes[i] || null)
    })
    this.trySubdivide()
  }

  visualize(show : boolean, scene : BABYLON.Scene, mat : BABYLON.Material) : void {
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

  pick(ray : BABYLON.Ray, pattern : TreesUtils.FindingPattern, options : any) : TreesUtils.Point[] {
    //console.time("  - finding Start")
    const hitOctants = this.findIntersecting(ray)
    if (!hitOctants) return [] // no octant hit

    const startingPointOctants = hitOctants
      .map(octant => ({ r: octant.distanceToCenter(ray.origin), octant }))
      .sort((o1, o2) => o1.r - o2.r)
      .map(o => o.octant)

    let startingPoint : BABYLON.Vector3
    startingPointOctants.some(octant => {
      const foundInOctant = octant.points.find(p => ray.intersectsBoxMinMax(p.box.min,p.box.max))
      if (!foundInOctant) return false
      startingPoint = foundInOctant.box.center
      return true
    })
    //console.timeEnd("  - finding Start")
    if (!startingPoint) return [] // no direct box hit
    return this.query(startingPoint, pattern, options)
  }

  query(startingPoint : BABYLON.Vector3 | BABYLON.Vector2, pattern : TreesUtils.FindingPattern, options : any) : TreesUtils.Point[] {
    if (!(options.radius === 0 || options.radius > 0)) {
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
    let candidates : TreesUtils.Point[] = []
    switch (pattern) {
      case TreesUtils.FindingPattern.KNearest:
        intersectedOctants.forEach(octant => {
          candidates.push(...octant.points)
          candidates = candidates
            .sort((a, b) => volume.distanceToCenter(a.box.center) - volume.distanceToCenter(b.box.center))
            .slice(0, options.k)
        })
        break
      case TreesUtils.FindingPattern.Radius:
        intersectedOctants.forEach(octant => {
          candidates.push(...octant.points.filter(p => volume.contains(p.box.center)))
        })
        break
    }
    //console.timeEnd("  - finding Query")
    return candidates
  }
}
