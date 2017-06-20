import { 
  Vector3, Mesh, InstancedMesh, Color3, StandardMaterial,
  Scene, VertexBuffer, VertexData, Material, MeshBuilder 
} from "../node_modules/babylonjs/dist/preview release/babylon.module"

export enum FindingPattern { KNearest, Radius }

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

export interface IVisualizable {
  visualization : InstancedMesh[] | Mesh[] | Mesh
  normalVisualization? : Mesh[] | Mesh

  visualize(showOrHide : boolean, material : Material, scene? : Scene) : void

  visualizeNormals?(showOrHide : boolean, color : string, scene? : Scene) : void

  destroy() : void
}

export function showVertexNormals(vertices : Vertex[], scene : Scene, color : string, offset : Vector3= new Vector3(0, 0, 0)) {
  const { min, max } = getExtents(vertices)
  const diff = max.subtract(min)
  const length = .05 * Math.max(diff.x, diff.y, diff.z)
  const lines = vertices.map((v, i) => {
    const v1 = v.position
    const v2 = v1.add(v.normal.scale(length))
    return [ v1.add(offset), v2.add(offset) ]
  })
  const ls = MeshBuilder.CreateLineSystem("lines", { lines, updatable: false }, scene)
  ls.color = getColor(color)
  return ls
}

export function showMeshsVertexNormals(mesh : Mesh, color : string) {
  const vertices = getVertices(mesh)
  return showVertexNormals(vertices, mesh.getScene(), color, mesh.position)
}

export function getVertices(mesh : Mesh) : Vertex[] {
  const nFlat = mesh.getVerticesData(VertexBuffer.NormalKind)
  const pFlat = mesh.getVerticesData(VertexBuffer.PositionKind)

  const vertices : Vertex[] = []
  for (let i = 0, j = 0; i < nFlat.length; i += 3, j++) {
    vertices.push(new Vertex(
      Vector3.FromArray(pFlat, i), Vector3.FromArray(nFlat, i), j
    ))
  }
  return vertices
}

export function getVertexData(vertices : Vertex[]) : VertexData {
  const unitVector = new Vector3(1, 1, 1)
  const pFlat = new Float32Array(vertices.length * 3)
  const nFlat = new Float32Array(vertices.length * 3)

  vertices.forEach((v, i) => {
    const i3 = i * 3
    v.position.toArray(pFlat, i3)
    ;(v.normal ? v.normal : unitVector).toArray(nFlat, i3)
  })

  const vd = new VertexData()
  vd.positions = pFlat
  vd.normals = nFlat
  vd.uvs = []
  vd.indices = []
  return vd
}

/** Retrieve minimum and maximum values for x,y,z out of
 * @param {Array<Array<Number>[3]>} points
 */
export function getExtents(vertices : Vertex[], pad? : boolean) {
  const max = new Vector3(-Infinity, -Infinity, -Infinity)
  const min = new Vector3( Infinity,  Infinity,  Infinity)

  for (let i = 0, len = vertices.length; i < len; i++) {
    const v = vertices[i].position
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

export function capitalize(str : string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function getColor(str : string) {
  return Color3[capitalize(str)]()
}

export class StdMaterial extends StandardMaterial {
  constructor(color : string, scene : Scene) {
    super("mat", scene)
    this.diffuseColor = getColor(color)
  }
}

export class PointCloudMaterial extends StandardMaterial {
  constructor(color : string, scene : Scene, unlit = false, pointSize = 4) {
    super("pointCloud", scene)
    this.diffuseColor = getColor(color)
    this.pointsCloud = true
    this.pointSize = pointSize
    this.disableLighting = unlit // enable this if you want to hide heavy zfighting
  }
}

export class WireFrameMaterial extends StandardMaterial {
  constructor(color : string, scene : Scene) {
    super("wireframe", scene)
    this.diffuseColor = getColor(color)
	  this.wireframe = true
  }
}