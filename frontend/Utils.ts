import * as BABYLON from "../node_modules/babylonjs/babylon.module"

export interface IVisualizable {
  visualization : BABYLON.InstancedMesh[] | BABYLON.Mesh[] | BABYLON.Mesh
  normalVisualization? : BABYLON.Mesh[] | BABYLON.Mesh

  visualize(showOrHide : boolean, material : BABYLON.Material, scene? : BABYLON.Scene) : void

  visualizeNormals?(showOrHide : boolean, color : BABYLON.Color3, scene? : BABYLON.Scene) : void

  destroy() : void
}

export function showVertexNormals(vertices : BABYLON.Vector3[], normals : BABYLON.Vector3[], scene : BABYLON.Scene, offset : BABYLON.Vector3= new BABYLON.Vector3(0, 0, 0)) {
  const { min, max } = getExtents(vertices)
  const diff = max.subtract(min)
  const length = .05 * Math.max(diff.x, diff.y, diff.z)
  const lines = normals.map((n, i) => {
    const v1 = vertices[i]
    const v2 = v1.add(n.scale(length))
    return [ v1.add(offset), v2.add(offset) ]
  })
  return BABYLON.MeshBuilder.CreateLineSystem("lines", { lines, updatable: false }, scene)
}

export function showMeshsVertexNormals(mesh : BABYLON.Mesh) {
  const { positions, normals } = getVertexData(mesh)
  return showVertexNormals(positions, normals, mesh.getScene(), mesh.position)
}

export function getVertexData(mesh : BABYLON.Mesh) {
  const normalsFlat = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind)
  const positionsFlat = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)

  const normals : BABYLON.Vector3[] = []
  const positions : BABYLON.Vector3[] = []
  const cp = (src : number[] | Float32Array, i : number) => BABYLON.Vector3.FromArray(src, i)
  for (let i = 0; i < normalsFlat.length; i += 3) {
    normals.push(cp(normalsFlat, i))
    positions.push(cp(positionsFlat, i))
  }
  return { positions, normals }
}

/** Retrieve minimum and maximum values for x,y,z out of
 * @param {Array<Array<Number>[3]>} points
 */
export function getExtents(points : BABYLON.Vector3[], pad? : boolean) {
  const max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity)
  const min = new BABYLON.Vector3( Infinity,  Infinity,  Infinity)

  for (let i = 0, len = points.length; i < len; i++) {
    const v = points[i]
    ;["x", "y", "z"].forEach(d => {
      if (v[d] < min[d]) min[d] = v[d]
      if (v[d] > max[d]) max[d] = v[d]
    })
  }
  if (pad) {
    const e = .02
    const padding = new BABYLON.Vector3(e, e, e)
    return { min: min.subtract(padding), max: max.add(padding)}
  } else {
    return { min, max }
  }
}