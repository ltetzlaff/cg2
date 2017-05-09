import * as BABYLON from "../../node_modules/babylonjs/babylon.module"

export namespace TreesUtils {
  export enum FindingPattern { KNearest, Radius }

  export interface IQueryable{
    findIntersecting(ray : BABYLON.Ray) : any
    findIntersecting(sphere : Sphere) : any
  }

  export interface Tree {
    children : any[]

    pick(ray : BABYLON.Ray, pattern : FindingPattern, options : any) : Point[]

    visualize(scene : BABYLON.Scene, container : BABYLON.Mesh[], mat : BABYLON.Material) : void
  }

  /** Retrieve minimum and maximum values for x,y,z out of
   * @param {Array<Array<Number>[3]>} points
   */
  export function getExtents(points : BABYLON.Vector3[]) {
    const max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity)
    const min = new BABYLON.Vector3( Infinity,  Infinity,  Infinity)
    
    for (let i = 0, len = points.length; i < len; i++) {
      const v = points[i]
      ;["x", "y", "z"].forEach(d => {
        if (v[d] < min[d]) min[d] = v[d]
        if (v[d] > max[d]) max[d] = v[d]
      })
    }
    return { min, max }
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

  export class Point {
    public box : Box
    public mesh : BABYLON.Mesh

    constructor(box : Box, mesh : BABYLON.Mesh) {
      this.box = box
      this.mesh = mesh
    }
  }


  export class Sphere {
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

    distanceToCenter(point : BABYLON.Vector3) : number {
      return point.subtract(this.center).length()
    }
  }
}