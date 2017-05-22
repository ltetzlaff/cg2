import * as BABYLON from "../node_modules/babylonjs/babylon.module"

//module BABYLON {
export class OFFFileLoader implements BABYLON.ISceneLoaderPlugin {
  public extensions : string = ".off"

  public importMesh(meshesNames: any, scene: BABYLON.Scene, data: any, rootUrl: string, meshes: BABYLON.AbstractMesh[], particleSystems: BABYLON.ParticleSystem[], skeletons: BABYLON.Skeleton[]): boolean {
    const parsedMesh = this.parseOFF(meshesNames, scene, data)
    if (meshes) {
      meshes.push(parsedMesh)
    }
    return true
  }

  public load(scene: BABYLON.Scene, data: string, rootUrl: string): boolean {
    return this.importMesh(null, scene, data, rootUrl, null, null, null);
  }

  private parseOFF (meshName : string, scene : BABYLON.Scene, data : string) : BABYLON.AbstractMesh {
    const lines : string[] = data.split("\n")

    lines.shift() // header line
    const whitespace = /\s+/

    // Prepare Mesh Structure
    const firstLine = lines.shift()
    //console.log(firstLine.trim().split(" "))
    const [numVertices, numFaces] : number[] = firstLine.trim().split(whitespace).map(Number)
    const positionsFlat : number[] = []
    const faces : number[] = []

    lines.forEach((line, i) => {
      const splits : string[] = line.trim().split(whitespace)
      if (i < numVertices) {
        const [x, z, y] = splits.map(parseFloat) // y and z exchanged
        positionsFlat.push(...[x, y, z])
      } else if (i < numVertices + numFaces) {
        splits.shift()
        faces.push(...splits.map(Number))
      }
    })

    const normalsFlat : number[] = []
    for (let i = 0; i < positionsFlat.length; i++) {
      normalsFlat[i] = 1
    }

    const vertexData = new BABYLON.VertexData()
    vertexData.positions = positionsFlat
    vertexData.indices = faces
    vertexData.uvs = []
    vertexData.normals = normalsFlat
    const parsedMesh = new BABYLON.Mesh(meshName, scene)
    vertexData.applyToMesh(parsedMesh)
    console.log("loading complete")
    return parsedMesh
  }
}

BABYLON.SceneLoader.RegisterPlugin(new OFFFileLoader())