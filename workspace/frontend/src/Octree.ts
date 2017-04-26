/** Retrieve minimum and maximum values for x,y,z out of
 * @param {Array<Array<Number>[3]>} points
 */
function getExtents(points : BABYLON.Vector3[]) {
  const max = [-Infinity, -Infinity, -Infinity]
  const min = [ Infinity,  Infinity,  Infinity]
  points.forEach(v => {
    ;[0, 1, 2].forEach(dim => {
      if (v[dim] < min[dim]) min[dim] = v[dim]
      if (v[dim] > max[dim]) max[dim] = v[dim]
    })
  })
  return { min: BABYLON.Vector3.FromArray(min), max : BABYLON.Vector3.FromArray(max)}
}

const BUCKETSIZE = 5

class Box {
  public min : BABYLON.Vector3
  public max : BABYLON.Vector3
  public size : BABYLON.Vector3
  
  constructor(min : BABYLON.Vector3, size : BABYLON.Vector3) {
    this.max = min.add(size)
    this.min = min
    this.size = size
  } 

  contains(point : BABYLON.Vector3) : boolean {
    // max - point >= min
    // Point within min and max
    return this.max
      .subtract(point)
      .asArray().every((v, i) => v >= this.min[i])
  }

  distanceToCenter(point : BABYLON.Vector3) : number {
    const center = this.min.add(this.size.scale(.5))
    return point.subtract(center).lengthSquared()
  }
}

class Octant extends Box {
  private static splitsInto = 8
  public children : Octant[]
  public points : BABYLON.Vector3[]

  findHitOctants(ray : BABYLON.Ray) : Octant[] {
    if (ray.intersectsBoxMinMax(this.min, this.max)) {
      if (this.children.length == 0) {
        return [this]
      } 
      return this.children.filter(child => child.findHitOctants(ray) !== null)
    }
    return null
  }

  subdivide(points) {
    const power = Math.log2(Octant.splitsInto) - 1
    const half = this.size.scale(.5)
    for (let x = 0; x < power; x++) {
      for (let y = 0; y < power; y++) {
        for (let z = 0; z < power; z++) {
          const offset = new BABYLON.Vector3(x * half.x, y * half.y, z * half.z)
          const min = this.min.add(offset)

          const octant = new Octant(min, half)
          points = points.filter(point => {
            if (octant.contains(point)) {
              octant.points.push(point)
              return false
            }
            return true
          })
          this.children.push()
        }
      }
    }
  }
}

const enum FindingPattern { KNearest, Radius }

namespace Trees {

export class Octree extends Octant {
  constructor(points : BABYLON.Vector3[]) {
    const { min, max } = getExtents(points)
    super(min, max.subtract(min))

    if (points.length < BUCKETSIZE) { 
      this.subdivide(points)
    } else {
      this.points = points
    }
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
const EPSILON : number = 10e7

class Sphere {
  private center : BABYLON.Vector3
  private radius : number

  constructor(center : BABYLON.Vector3, radius : number) {
    this.center = center
    this.radius = radius
  }

  contains(p : BABYLON.Vector3) {
    const r = this.radius
    const c = this.center
    return (p.x - c.x)**2 + (p.y - c.y)**2 + (p.z - c.z)**2 <= r*r
  }

  distanceToCenter(point : BABYLON.Vector3) : number {
    return point.subtract(this.center).lengthSquared()
  }
}

function isOnLine(p : BABYLON.Vector3, ray : BABYLON.Ray) : boolean {
  return BABYLON.Vector3.Dot(ray.direction, p.subtract(ray.origin)) <= EPSILON
}