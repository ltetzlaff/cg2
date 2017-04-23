"use strict"

module BABYLON {
  export class OFFFileLoader implements ISceneLoaderPlugin {
    public extensions : string = ".off"

    public importMesh(meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]): boolean {
      const parsedMesh = this.parseOFF(meshesNames, scene, data)
      console.log(parsedMesh)
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

      // Prepare Mesh Structure
      const firstLine = lines.shift()
      console.log(firstLine.trim().split(" "))
      const [numVertices, numFaces] : number[] = firstLine.trim().split(" ").map(Number)
      const positionsFlat : number[] = []
      const faces : number[] = []
      
      lines.forEach((line, i) => {
        const splits : string[] = line.trim().split(" ")
        if (i < numVertices) {
          positionsFlat.push(...splits.map(parseFloat))
        } else if (i < numVertices + numFaces) {
          splits.shift()
          faces.push(...splits.map(Number))
        }
      })

      console.log(positionsFlat, faces)
      const vertexData = new BABYLON.VertexData()
      vertexData.positions = positionsFlat
      vertexData.indices = faces

      const parsedMesh = new BABYLON.Mesh(meshName, scene)
      vertexData.applyToMesh(parsedMesh)
      return parsedMesh
    }
  }

  BABYLON.SceneLoader.RegisterPlugin(new OFFFileLoader())
}