import { Vector3, Vector2 } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import * as math from "mathjs"


enum Degree {
  Constant, Linear, Quadratic
}

export class PolynomialBasis {
  public degree : Degree
  public length : number

  constructor(degree : Degree, dimensions : number) {
    this.degree = degree
    switch (degree) {
      case Degree.Constant:
        this.length = 1
        break
      case Degree.Linear:
        this.length = dimensions === 3 ? 4 : 3
        break        
      case Degree.Quadratic:
        this.length = dimensions === 3 ? 10 : 6
        break        
    }
  }

  vector(v : Vector2 | Vector3) {
    if (v instanceof Vector2) {
      return this.vector2(v)
    } else if (v instanceof Vector3) {
      return this.vector3(v)
    } else {
      throw new TypeError()
    }
  }

  private vector2(v : Vector2) {
    const { x, y } = v
    switch (this.degree) {
      case Degree.Constant:
        return [1]
      case Degree.Linear:
        return [1, x, y]
      case Degree.Quadratic:
        return [1, x, y, x*x, x*y, y*y]
    }
  }

  private vector3(v : Vector3) {
    const { x, y, z } = v
    switch (this.degree) {
      case Degree.Constant:
        return [1]
      case Degree.Linear:
        return [1, x, y, z]
      case Degree.Quadratic:
        return [1, x, y, z, x*y, y*z, x*z, x*x, y*y, z*z]
    }
  }

  matrix(v : Vector3 | Vector2) {
    const vector = this.vector(v)
    return math.multiply(vector, math.transpose(vector))
  }

  static Constant(dimensions : number) {
    return new PolynomialBasis(Degree.Constant, dimensions)
  }
  
  static Linear(dimensions : number) {
    return new PolynomialBasis(Degree.Linear, dimensions)
  }
  
  static Quadratic(dimensions : number) {
    return new PolynomialBasis(Degree.Quadratic, dimensions)
  }
}