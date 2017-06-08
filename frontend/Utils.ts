import { Vector3, Mesh, InstancedMesh, Color3, Scene, VertexBuffer, Material, MeshBuilder } from "../node_modules/babylonjs/dist/preview release/babylon.module"

export interface IVisualizable {
  visualization : InstancedMesh[] | Mesh[] | Mesh
  normalVisualization? : Mesh[] | Mesh

  visualize(showOrHide : boolean, material : Material, scene? : Scene) : void

  visualizeNormals?(showOrHide : boolean, color : Color3, scene? : Scene) : void

  destroy() : void
}

export function showVertexNormals(vertices : Vector3[], normals : Vector3[], scene : Scene, offset : Vector3= new Vector3(0, 0, 0)) {
  const { min, max } = getExtents(vertices)
  const diff = max.subtract(min)
  const length = .05 * Math.max(diff.x, diff.y, diff.z)
  const lines = normals.map((n, i) => {
    const v1 = vertices[i]
    const v2 = v1.add(n.scale(length))
    return [ v1.add(offset), v2.add(offset) ]
  })
  return MeshBuilder.CreateLineSystem("lines", { lines, updatable: false }, scene)
}

export function showMeshsVertexNormals(mesh : Mesh) {
  const { positions, normals } = getVertexData(mesh)
  return showVertexNormals(positions, normals, mesh.getScene(), mesh.position)
}

export function getVertexData(mesh : Mesh) {
  const normalsFlat = mesh.getVerticesData(VertexBuffer.NormalKind)
  const positionsFlat = mesh.getVerticesData(VertexBuffer.PositionKind)

  const normals : Vector3[] = []
  const positions : Vector3[] = []
  const cp = (src : number[] | Float32Array, i : number) => Vector3.FromArray(src, i)
  for (let i = 0; i < normalsFlat.length; i += 3) {
    normals.push(cp(normalsFlat, i))
    positions.push(cp(positionsFlat, i))
  }
  return { positions, normals }
}

/** Retrieve minimum and maximum values for x,y,z out of
 * @param {Array<Array<Number>[3]>} points
 */
export function getExtents(points : Vector3[], pad? : boolean) {
  const max = new Vector3(-Infinity, -Infinity, -Infinity)
  const min = new Vector3( Infinity,  Infinity,  Infinity)

  for (let i = 0, len = points.length; i < len; i++) {
    const v = points[i]
    ;["x", "y", "z"].forEach(d => {
      if (v[d] < min[d]) min[d] = v[d]
      if (v[d] > max[d]) max[d] = v[d]
    })
  }
  if (pad) {
    const e = .02
    const padding = new Vector3(e, e, e)
    return { min: min.subtract(padding), max: max.add(padding)}
  } else {
    return { min, max }
  }
}