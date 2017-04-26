/// <reference path="Trees.ts" />

namespace Trees {
  export class Octant extends Box {
    private static splitsInto = 8
    public children : Octant[]
    public level : number
    public points : BABYLON.Vector3[]

    constructor(min : BABYLON.Vector3, size : BABYLON.Vector3, level : number) {
      super(min, size)
      this.level = level
      this.children = []
      this.points = []
    }

    findHitOctants(ray : BABYLON.Ray) : Octant[] {
      if (ray.intersectsBoxMinMax(this.min, this.max)) {
        if (this.children.length == 0) {
          return [this]
        } 
        return this.children.filter(child => child.findHitOctants(ray) !== null)
      }
      return null
    }

    trySubdivide() {
      if (this.level === MAXDEPTH || this.points.length <= BUCKETSIZE) {
        return
      }
      
      const power = Math.log(Octant.splitsInto)/Math.log(2) - 1
      const half = this.size.scale(.5)
      for (let x = 0; x < power; x++) {
        for (let y = 0; y < power; y++) {
          for (let z = 0; z < power; z++) {
            const offset = new BABYLON.Vector3(x * half.x, y * half.y, z * half.z)
            const min = this.min.add(offset)

            const octant = new Octant(min, half, this.level + 1)
            this.children.push(octant)            
            this.points = this.points.filter(point => {
              if (octant.contains(point)) {
                octant.points.push(point)
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



  export class Octree extends Octant implements Tree {
    constructor(points : BABYLON.Vector3[]) {
      const { min, max } = getExtents(points)
      super(min, max.subtract(min), 0)

      this.points = points
      this.trySubdivide()
    }

    pick(ray : BABYLON.Ray, pattern : FindingPattern = FindingPattern.KNearest, options : any) : BABYLON.Vector3[] {
      const relevantOctants = this.findHitOctants(ray)
        .map(octant => ({ r: octant.distanceToCenter(ray.origin), octant }))
        .sort((o1, o2) => o1.r - o2.r)
        .map(o => o.octant)
      
      const candidates : BABYLON.Vector3[] = []
      let sphere : Sphere

      relevantOctants.forEach(octant => {
        if (sphere) {
          switch (pattern) {
            case FindingPattern.KNearest:
              candidates.push(...octant.points)
              break
            case FindingPattern.Radius:
              candidates.push(...octant.points.filter(p => sphere.contains(p)))
              break
          }
        } else {
          sphere = new Sphere(octant.points.find(p => isOnLine(p, ray)), options.radius)
        }
      })

      if (pattern == FindingPattern.KNearest) {
        return candidates
          .sort((a, b) => sphere.distanceToCenter(a) - sphere.distanceToCenter(b))
          .slice(0, options.k - 1)
      } else {
        return candidates
      }
    }
  }
}