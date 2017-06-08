import { Vector3, Mesh, Color3, Scene, Material, VertexBuffer } from "../../node_modules/babylonjs/dist/preview release/babylon.module"
import { IVisualizable, showMeshsVertexNormals } from "../Utils"

export class SurfaceMesh extends Mesh implements IVisualizable {
  public visualization : Mesh
  public normalVisualization: Mesh
  public fakeNormals : boolean // #DEBUG

  public flatten() {
    // Partly adapted from Mesh.convertToFlatShadedMesh 
    const vbs : VertexBuffer[] = []
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
    const oldNormals = newData[VertexBuffer.NormalKind]
    
    for (let i = 0; i < totalIndices; i++) {
      indices[i]      = i
    }

    for (let i = 0; i < totalIndices; i += 6) {
      const sn = new Vector3(0, 0, 0)
      for (let j = 0; j < 6; j++) {
        const face = (i + j) * 3
        sn.x += oldNormals[face]
        sn.y += oldNormals[face + 1]
        sn.z += oldNormals[face + 2]
      }
      sn.scaleInPlace(1/6)
      
      for (let j = 0; j < 6; j++) {
        normals.push(sn.x)
        normals.push(sn.y)
        normals.push(sn.z)
      }
    }

    this.setVerticesData(VertexBuffer.NormalKind, normals, false)

    this.setIndices(indices)

    // Updating vertex buffers
    for (let k = 0; k < kinds.length; k++) {
      const kind = kinds[k]
      if (kind === VertexBuffer.NormalKind) continue

      this.setVerticesData(kind, newData[kind], false)
    }
  }

  public destroy() {
    if (this.normalVisualization) this.normalVisualization.dispose()
    if (this.visualization) this.visualization.dispose()
    this.dispose()
  }

  visualizeNormals(show : boolean, color : Color3, scene? : Scene) {
    if (this.normalVisualization) this.normalVisualization.dispose()
    if (!show) return

    const ls = showMeshsVertexNormals(this)
    ls.color = color
    this.normalVisualization = ls
  }

  public visualize(show : boolean, material : Material, _scene?: Scene) {
    this.isVisible = show
    if (!show) return

    if (!this.fakeNormals) { // #DEBUG
      this.convertToFlatShadedMesh()
    }

    this.flatten()
    this.material = material
  }
}