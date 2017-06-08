import { Vector3 } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import * as math from "mathjs"


enum Degree {
  Constant, Linear, Quadratic
}

export class PolynomialBasis {
  public degree : Degree
  public length : number

  constructor(degree : Degree) {
    this.degree = degree
    switch (degree) {
      case Degree.Constant:
        this.length = 1
        break
      case Degree.Linear:
        this.length = 4
        break        
      case Degree.Quadratic:
        this.length = 10
        break        
    }
  }

  vector(v : Vector3) {
    const {x, y, z} = v
    switch (this.degree) {
      case Degree.Constant:
        return [1]
      case Degree.Linear:
        return [1, x, y, z]
      case Degree.Quadratic:
        return [1, x, y, z, x*y, y*z, x*z, x*x, y*y, z*z]
    }
  }

  matrix(v : Vector3) {
    const vector = this.vector(v)
    return math.multiply(vector, math.transpose(vector))
  }

  static Constant() {
    return new PolynomialBasis(Degree.Constant)
  }
  
  static Linear() {
    return new PolynomialBasis(Degree.Linear)
  }
  
  static Quadratic() {
    return new PolynomialBasis(Degree.Quadratic)
  }
}