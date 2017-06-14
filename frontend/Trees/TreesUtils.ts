import { Vector3, Vector2, Ray, MathTools } from "../../node_modules/babylonjs/dist/preview release/babylon.module"

export class Vertex {
  public position : Vector3
  public normal : Vector3
  public index : number

  constructor(position : Vector3, normal? : Vector3, index? : number) {
    this.position = position
    this.normal = normal
    this.index = index
  }
}

export namespace TreesUtils {
  export enum FindingPattern { KNearest, Radius }

  export interface IQueryable{
    findIntersecting(ray : Ray) : any
    findIntersecting(sphere : Sphere) : any
    findIntersecting(tube : Tube) : any
  }

  const EPSILON : number = 10e7

  export function isOnLine(p : Vector3, ray : Ray) : boolean {
    return Vector3.Dot(ray.direction, p.subtract(ray.origin)) <= EPSILON
  }

  export class Box {
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
      const min = this.min
      const max = this.max
      return (p.x >= min.x && p.y >= min.y && p.z >= min.z
            && p.x <= max.x && p.y <= max.y && p.z <= max.z)
    }

    distanceToCenter(point : Vector3) : number {
      return point.subtract(this.center).lengthSquared()
    }
  }

  export interface IVolume {
    contains(point : Vector3) : boolean
    distanceToCenter(point : Vector3) : number
  }

  // adapted from https://www.gamedev.net/topic/649000-intersection-between-a-circle-and-an-aabb/?view=findpost&p=5102113
  export function rectInCircle(min : Vector3, max : Vector3, x : number, z : number, r : number) : boolean {
    const p = new Vector2(MathTools.Clamp(x, min.x, max.x), MathTools.Clamp(z, min.z, max.z))
    const dist = new Vector2(x, z).subtract(p)
    const d = dist.length()
    return d <= r
  }

  export class Tube implements IVolume {
    public center : Vector2
    public radius : number

    constructor(center : Vector2, radius : number) {
      this.center = center
      this.radius = radius
    }

    intersectsBoxMinMax(min : Vector3, max : Vector3) : boolean {
      const x = this.center.x
      const z = this.center.y
      return rectInCircle(min, max, x, z, this.radius)
    }

    contains(p : Vector3) : boolean {
      const r = this.radius
      return (new Vector2(p.x, p.z)).subtract(this.center).lengthSquared() <= r*r
    }

    distanceToCenter(p : Vector3) : number {
      return (new Vector2(p.x, p.z)).subtract(this.center).length()
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
}