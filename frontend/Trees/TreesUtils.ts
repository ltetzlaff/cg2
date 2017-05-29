import * as BABYLON from "../../node_modules/babylonjs/babylon.module"

export namespace TreesUtils {
  export enum FindingPattern { KNearest, Radius }

  export interface IQueryable{
    findIntersecting(ray : BABYLON.Ray) : any
    findIntersecting(sphere : Sphere) : any
    findIntersecting(tube : Tube) : any
  }

  const EPSILON : number = 10e7

  export function isOnLine(p : BABYLON.Vector3, ray : BABYLON.Ray) : boolean {
    return BABYLON.Vector3.Dot(ray.direction, p.subtract(ray.origin)) <= EPSILON
  }

  export class Box {
    public min : BABYLON.Vector3
    public max : BABYLON.Vector3
    public size : BABYLON.Vector3
    public center : BABYLON.Vector3

    constructor(min : BABYLON.Vector3, size : BABYLON.Vector3) {
      this.max = min.add(size)
      this.min = min
      this.size = size
      this.center = min.add(size.scale(.5))
    }

    contains(p : BABYLON.Vector3) : boolean {
      // max - point >= min
      // Point within min and max
      const min = this.min
      const max = this.max
      return (p.x >= min.x && p.y >= min.y && p.z >= min.z
            && p.x <= max.x && p.y <= max.y && p.z <= max.z)
    }

    distanceToCenter(point : BABYLON.Vector3) : number {
      return point.subtract(this.center).lengthSquared()
    }
  }

  export interface IVolume {
    contains(point : BABYLON.Vector3) : boolean
    distanceToCenter(point : BABYLON.Vector3) : number
  }

  // adapted from https://www.gamedev.net/topic/649000-intersection-between-a-circle-and-an-aabb/?view=findpost&p=5102113
  export function rectInCircle(min : BABYLON.Vector3, max : BABYLON.Vector3, x : number, z : number, r : number) : boolean {
    const p = new BABYLON.Vector2(BABYLON.MathTools.Clamp(x, min.x, max.x), BABYLON.MathTools.Clamp(z, min.z, max.z))
    const dist = new BABYLON.Vector2(x, z).subtract(p)
    const d = dist.length()
    return d <= r
  }

  export class Tube implements IVolume {
    public center : BABYLON.Vector2
    public radius : number

    constructor(center : BABYLON.Vector2, radius : number) {
      this.center = center
      this.radius = radius
    }

    intersectsBoxMinMax(min : BABYLON.Vector3, max : BABYLON.Vector3) : boolean {
      const x = this.center.x
      const z = this.center.y
      return rectInCircle(min, max, x, z, this.radius)
    }

    contains(p : BABYLON.Vector3) : boolean {
      const r = this.radius
      return (new BABYLON.Vector2(p.x, p.z)).subtract(this.center).lengthSquared() <= r*r
    }

    distanceToCenter(p : BABYLON.Vector3) : number {
      return (new BABYLON.Vector2(p.x, p.z)).subtract(this.center).length()
    }
  }

  export class Cylinder {
    public pivot : BABYLON.Vector3
    public radius : number
    public height : number

    constructor(pivot : BABYLON.Vector3, radius : number, height : number) {
      this.pivot = pivot
      this.radius = radius
      this.height = height
    }

    intersectsBoxMinMax(min : BABYLON.Vector3, max : BABYLON.Vector3) : boolean {
      const { x, y, z } = this.pivot
      if (y < min.y || y + this.height > max.y) return false
      return rectInCircle(min, max, x, z, this.radius)
    }
  }

  export class Sphere implements IVolume {
    public center : BABYLON.Vector3
    public radius : number

    constructor(center : BABYLON.Vector3, radius : number) {
      this.center = center
      this.radius = radius
    }

    contains(p : BABYLON.Vector3) {
      const r = this.radius
      return p.subtract(this.center).lengthSquared() <= r*r
    }

    distanceToCenter(p : BABYLON.Vector3) : number {
      return p.subtract(this.center).length()
    }
  }
}