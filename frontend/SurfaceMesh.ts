import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import { IVisualizable } from "./Utils"

export class SurfaceMesh extends BABYLON.Mesh implements IVisualizable {
  public visualization : BABYLON.Mesh
  private normalLines : BABYLON.Mesh

  public visualize(show : boolean, material : BABYLON.Material, _scene?: BABYLON.Scene) {
    this.isVisible = show
    
    if (!show) {
      return
    }

    //this.convertToFlatShadedMesh()
    this.flatten()
    this.material = material
  }

  public flatten() {
    // Partly adapted from BABYLON.Mesh.convertToFlatShadedMesh 
    const vbs : BABYLON.VertexBuffer[] = []
    const data : any[] = []
    const newData : any[] = []

    // Retrieve VertexData Buffers
    const kinds = this.getVerticesDataKinds()
    for (let k = 0; k < kinds.length; k++) {
      const kind = kinds[k]
      const vb = this.getVertexBuffer(kind)

      vbs[kind] = vb
      data[kind] = vb.getData()
      newData[kind] = []
    }

    // Instancing each vertex per triangle
    const indices = this.getIndices()
    const totalIndices = this.getTotalIndices()
    for (let i = 0; i < totalIndices; i++) {
      const ind = indices[i]


      for (let k = 0; k < kinds.length; k++) {
        const kind = kinds[k]
        const stride = vbs[kind].getStrideSize()
        for (let n = 0; n < stride; n++) {
          const d = data[kind][ind * stride + n]
          newData[kind].push(d)
        }
      }
    }

    // Calculate Surface Normals
    const normals : number[] = []
    const oldNormals = newData[BABYLON.VertexBuffer.NormalKind]
    
    for (let i = 0; i < totalIndices; i += 3) {
      indices[i]      = i
      indices[i + 1]  = i + 1
      indices[i + 2]  = i + 2
    }

    for (let i = 0; i < totalIndices; i += 6) {
      let sn = new BABYLON.Vector3(0, 0, 0)
      for (let j = 0; j < 6; j++) {
        sn.x += oldNormals[(i + j) * 3]
        sn.y += oldNormals[(i + j) * 3 + 1]
        sn.z += oldNormals[(i + j) * 3 + 2]
      }
      sn.scaleInPlace(1/6)
      
      for (let j = 0; j < 6; j++) {
        normals.push(sn.x)
        normals.push(sn.y)
        normals.push(sn.z)
      }
    }

    this.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals, false)
    

    this.setIndices(indices)

    // Updating vertex buffers
    for (let k = 0; k < kinds.length; k++) {
      const kind = kinds[k]
      if (kind === BABYLON.VertexBuffer.NormalKind) continue

      this.setVerticesData(kind, newData[kind], false)
    }
  }

  public destroy() {
    this.dispose()
  }

  debugNormals(show : boolean) {
    if (this.normalLines) this.normalLines.dispose()
    
    if (!show) return

    const normals = this.getVerticesData(BABYLON.VertexBuffer.NormalKind)
    const positions = this.getVerticesData(BABYLON.VertexBuffer.PositionKind)
    
    const length = .05
    const lines = []
    for (var i = 0; i < normals.length; i += 3) {
        const v1 = BABYLON.Vector3.FromArray(positions, i)
        const v2 = v1.add(BABYLON.Vector3.FromArray(normals, i).scaleInPlace(length))
        lines.push([v1.add(this.position), v2.add(this.position)])
    }
    const normalLines = BABYLON.MeshBuilder.CreateLineSystem("normalLines", { lines, updatable: false }, this.getScene())
    normalLines.color = BABYLON.Color3.White()
    this.normalLines = normalLines
  }
}