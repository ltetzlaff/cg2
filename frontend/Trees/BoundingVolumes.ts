import { Vector3, Vector2, Ray, MathTools, BoundingBox } from "../../node_modules/babylonjs/dist/preview release/babylon.module"

const EPSILON : number = 10e7

export interface IVolume {
  contains(point : Vector3) : boolean
  distanceToCenter(point : Vector3) : number
}

export class Tube implements IVolume {
  public center : Vector2
  public radius : number

  constructor(center : Vector2, radius : number) {
    this.center = center
    this.radius = radius
  }

  intersectsBoxMinMax(min : Vector3, max : Vector3) : boolean {
    const { x, y } = this.center
    return rectInCircle(min, max, x, y, this.radius)
  }

  contains(p : Vector3) : boolean {
    const r = this.radius
    return (new Vector2(p.x, p.z)).subtract(this.center).lengthSquared() <= r*r
  }

  distanceToCenter(p : Vector3) : number {
    return (new Vector2(p.x, p.z)).subtract(this.center).length()
  }
}

export class Sphere implements IVolume {
  public center : Vector3
  public radius : number

  constructor(center : Vector3, radius : number) {
    this.center = center
    this.radius = radius
  }

  contains(p : Vector3) {
    const r = this.radius
    return p.subtract(this.center).lengthSquared() <= r*r
  }

  distanceToCenter(p : Vector3) : number {
    return p.subtract(this.center).length()
  }
}

export class Box implements IVolume {
  public min : Vector3
  public max : Vector3
  public size : Vector3
  public center : Vector3

  constructor(min : Vector3, size : Vector3) {
    this.max = min.add(size)
    this.min = min
    this.size = size
    this.center = min.add(size.scale(.5))
  }

  contains(p : Vector3) : boolean {
    // max - point >= min
    // Point within min and max
    const { min, max } = this
    return (p.x >= min.x && p.y >= min.y && p.z >= min.z
          && p.x <= max.x && p.y <= max.y && p.z <= max.z)
  }

  distanceToCenter(point : Vector3) : number {
    return point.subtract(this.center).lengthSquared()
  }
}

export class Cylinder {
  public pivot : Vector3
  public radius : number
  public height : number

  constructor(pivot : Vector3, radius : number, height : number) {
    this.pivot = pivot
    this.radius = radius
    this.height = height
  }

  intersectsBoxMinMax(min : Vector3, max : Vector3) : boolean {
    const { x, y, z } = this.pivot
    if (y < min.y || y + this.height > max.y) return false
    return rectInCircle(min, max, x, z, this.radius)
  }
}

export function intersects(x : Ray | Sphere | Cylinder | Tube, min : Vector3, max : Vector3) {
  let b = false
  if (x instanceof Ray) {
    b = (x as Ray).intersectsBoxMinMax(min, max)
  } else if (x instanceof Sphere) {
    const s = x as Sphere
    b = BoundingBox.IntersectsSphere(min, max, s.center, s.radius)
  } else if (x instanceof Cylinder) {
    const c = x as Cylinder
    b = c.intersectsBoxMinMax(min, max)
  } else if (x instanceof Tube) {
    const t = x as Tube
    b = rectInCircle(min, max, t.center.x, t.center.y, t.radius)
    //b = t.intersectsBoxMinMax(min, max)
  }
  return b
}


export function isOnLine(p : Vector3, ray : Ray) : boolean {
  return Vector3.Dot(ray.direction, p.subtract(ray.origin)) <= EPSILON
}

// adapted from https://www.gamedev.net/topic/649000-intersection-between-a-circle-and-an-aabb/?view=findpost&p=5102113
export function rectInCircle(min : Vector3, max : Vector3, x : number, z : number, r : number) : boolean {
  const p = new Vector2(MathTools.Clamp(x, min.x, max.x), MathTools.Clamp(z, min.z, max.z))
  const dist = new Vector2(x, z).subtract(p)
  const d = dist.length()
  return d <= r
}

export function getRadialBoundingVolume(point : Vector2 | Vector3, radius : number) : IVolume {
  if (point instanceof Vector3) {
    return new Sphere(point, radius)
  } else if (point instanceof Vector2) {
    return new Tube(point, radius)
  }
}