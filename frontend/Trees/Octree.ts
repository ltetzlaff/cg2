import { Vector3, Vector2, Ray, Mesh, MeshBuilder, Material, Scene } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { Box, intersects, getRadialBoundingVolume } from "./BoundingVolumes"
import { Tree, IQueryable } from "./Tree"
import { Vertex, FindingPattern, IVisualizable, getExtents } from "../Utils"

export class OctreeOptions {
  public bucketSize : number
  public maxDepth : number

  constructor(bucketSize : number, maxDepth : number) {
    this.bucketSize = bucketSize
    this.maxDepth = maxDepth
  }
}

export class Octant extends Box implements IQueryable {
  private static splitsInto = 8
  public children : Octant[]
  public points : Vertex[]
  public level : number
  private options : OctreeOptions

  constructor(min : Vector3, size : Vector3, level : number, options : OctreeOptions) {
    super(min, size)
    this.level = level
    this.children = []
    this.points = []
    this.options = options
  }

  findIntersecting(x : any) : Octant[] {
    const ret : Octant[] = []

    if (intersects(x, this.min, this.max)) {
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
          const offset = new Vector3(x * half.x, y * half.y, z * half.z)
          const min = this.min.add(offset)

          const octant = new Octant(min, half, this.level + 1, this.options)
          this.children.push(octant)
          this.points = this.points.filter(p => {
            if (octant.contains(p.position)) {
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
  public visualization : Mesh[]

  constructor(vertices : Vertex[], options : OctreeOptions) {
    let { min, max } = getExtents(vertices, true)
    super(min, max.subtract(min), 0, options)

    this.visualization = []
    this.points = vertices
    this.trySubdivide()
  }

  visualize(show : boolean, mat : Material, scene?: Scene) : void {
    if (!show) {
      this.visualization.forEach(m => m.dispose())
      this.visualization = []
      return
    }

    const viz = (octant : Octant) => {
      const s = octant.size
      const b = MeshBuilder.CreateBox("octant lv" + octant.level,
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

  pick(ray : Ray, pattern : FindingPattern, options : any) : Vertex[] {
    //console.time("  - finding Start")
    const hitOctants = this.findIntersecting(ray)
    if (!hitOctants) return [] // no octant hit

    const startingPointOctants = hitOctants
      .map(octant => ({ r: octant.distanceToCenter(ray.origin), octant }))
      .sort((o1, o2) => o1.r - o2.r)
      .map(o => o.octant)

    const e = .01
    const epsilon = new Vector3(e, e, e)

    let startingPoint : Vector3
    startingPointOctants.some(octant => {
      const foundInOctant = octant.points.find(p => {
        return ray.intersectsBoxMinMax(p.position.subtract(epsilon), p.position.add(epsilon))
      })
      if (!foundInOctant) return false
      startingPoint = foundInOctant.position
      return true
    })
    //console.timeEnd("  - finding Start")
    if (!startingPoint) return [] // no direct box hit
    return this.query(startingPoint, pattern, options)
  }

  query(startingPoint : Vector3 | Vector2, pattern : FindingPattern, options : any) : Vertex[] {
    if (pattern === FindingPattern.KNearest) {
      options.radius = Number.MAX_VALUE // knearest just needs a point
    }

    let intersectedOctants : Octant[] = []
    const volume = getRadialBoundingVolume(startingPoint, options.radius)
    intersectedOctants = this.findIntersecting(volume)

    //console.time("  - finding Query")
    let candidates : Vertex[] = []
    switch (pattern) {
      case FindingPattern.KNearest:
        intersectedOctants.forEach(octant => {
          candidates.push(...octant.points)            
        })
        candidates = candidates
          .sort((a, b) => volume.distanceToCenter(a.position) - volume.distanceToCenter(b.position))
          .slice(0, options.k)
        break
      case FindingPattern.Radius:
        intersectedOctants.forEach(octant => {
          octant.points.forEach(p => {
            if (volume.contains(p.position)) candidates.push(p)
          })
        })
        candidates = candidates
          .sort((a, b) => volume.distanceToCenter(a.position) - volume.distanceToCenter(b.position))          
        break
    }
    //console.timeEnd("  - finding Query")
    return candidates
  }
}
