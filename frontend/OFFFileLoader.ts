import { Vector3, Scene, SceneLoader, ISceneLoaderPlugin, Mesh, AbstractMesh, VertexData, Skeleton, ParticleSystem } from "../node_modules/babylonjs/dist/preview release/babylon.module"

//module BABYLON {
export class OFFFileLoader implements ISceneLoaderPlugin {
  public extensions : string = ".off"

  public importMesh(meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]): boolean {
    const parsedMesh = this.parseOFF(meshesNames, scene, data)
    if (meshes) {
      meshes.push(parsedMesh)
    }
    return true
  }

  public load(scene: Scene, data: string, rootUrl: string): boolean {
    return this.importMesh(null, scene, data, rootUrl, null, null, null);
  }

  private parseOFF (meshName : string, scene : Scene, data : string) : AbstractMesh {
    const lines : string[] = data.split("\n")

    lines.shift() // header line
    const whitespace = /\s+/

    // Prepare Mesh Structure
    let firstLine = lines.shift()

    if (firstLine.startsWith("NOFF")) firstLine = lines.shift()

    //console.log(firstLine.trim().split(" "))
    const [numVertices, numFaces] : number[] = firstLine.trim().split(whitespace).map(Number)
    const positionsFlat : number[] = []
    const normalsFlat : number[] = []
    const faces : number[] = []

    lines.forEach((line, i) => {
      const splits : string[] = line.trim().split(whitespace)
      if (i < numVertices) {
        const [x, z, y, nx, nz, ny] = splits.map(parseFloat) // y and z exchanged
        positionsFlat.push(...[x, y, z])
        if (splits.length >= 6) normalsFlat.push(...[nx, ny, nz])
      } else if (i < numVertices + numFaces) {
        splits.shift()
        faces.push(...splits.map(Number))
      }
    })

    const vertexData = new VertexData()
    vertexData.positions = positionsFlat
    vertexData.indices = faces
    vertexData.uvs = []
    vertexData.normals = normalsFlat
    const parsedMesh = new Mesh(meshName, scene)
    vertexData.applyToMesh(parsedMesh)
    console.log("loading complete")
    return parsedMesh
  }
}

SceneLoader.RegisterPlugin(new OFFFileLoader())