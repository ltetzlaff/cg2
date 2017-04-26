/// <reference path="../../node_modules/babylonjs/babylon.d.ts" />

const convertToPointCloud = (mesh : BABYLON.AbstractMesh, scene : BABYLON.Scene) => {
  const vertexCoordinates = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)
      
  if (vertexCoordinates.length % 3 !== 0) {
    throw new RangeError("Vertices array doesn't seem to consist of Vector3s")
  }

  const boxOptions = { size: .05 }
  const vertCount = vertexCoordinates.length / 3
  const vertices = new Array<BABYLON.Vector3>(vertCount)
  const vertMeshes = new Array<BABYLON.Mesh>(vertCount)
  for (let i = 0; i < vertCount; i++) {
    let j = i * 3
    vertices[i] = new BABYLON.Vector3(vertexCoordinates[j], vertexCoordinates[j+1], vertexCoordinates[j+2])
    vertMeshes[i] = BABYLON.MeshBuilder.CreateBox("v" + i, boxOptions, scene)
    vertMeshes[i].setAbsolutePosition(vertices[i])
  }

  //scene.meshes.push(...vertMeshes) 

  // Create Octree
  const octree = new Trees.Octree(vertices)
  const octreeVizMat = new WireFrameMaterial(BABYLON.Color3.Green(), scene)


  const visualize = (octant : Trees.Octant, scene : BABYLON.Scene) => {
    const s = octant.size
    const b = BABYLON.MeshBuilder.CreateBox("octant lv" + octant.level, 
      { width: s[0], height: s[1], depth: s[2] }, scene)
    b.setAbsolutePosition(octant.center)
    b.material = octreeVizMat

    // recurse
    octant.children.forEach(child => visualize(child, scene))
  }

  //visualize(octree, scene)
  Object.defineProperty(window, "octree", { value: octree})
}


class Engine {
  private canvas : HTMLCanvasElement
  private engine: BABYLON.Engine
  private scene : BABYLON.Scene
  private loader : BABYLON.AssetsManager
  private sun: BABYLON.Light
  private cam : BABYLON.ArcRotateCamera
  private wfMat : BABYLON.Material

  constructor(canvas) {
    this.canvas = canvas
    this.engine = new BABYLON.Engine(canvas, true)
    this.engine.enableOfflineSupport = false

    // Setup Scene
    this.scene = new BABYLON.Scene(this.engine)
    this.loader = new BABYLON.AssetsManager(this.scene)
    this.cam = new BABYLON.ArcRotateCamera("Main Cam", -20, 0, 10, BABYLON.Vector3.Zero(), this.scene)
    this.cam.attachControl(this.canvas, false)
    this.sun = new BABYLON.HemisphericLight("Sun", new BABYLON.Vector3(0, 1, 0), this.scene)

    this.wfMat = new WireFrameMaterial(BABYLON.Color3.Red(), this.scene)

    const ground = BABYLON.MeshBuilder.CreateGround("Ground", {
      width: 5, height: 5, subdivisions: 1
    }, this.scene)
  }

  run() : void {
    window.addEventListener("resize", () => this.engine.resize())
    this.engine.runRenderLoop(() => this.scene.render())
  }

  load(file : string, asPointCloud : boolean = false) : void {
    BABYLON.SceneLoader.ImportMesh(file, "/models/", file, this.scene, meshes => { 
      // Remove old meshes
      if (this.scene.meshes.length) this.scene.meshes = []
      
      if (asPointCloud) {
        convertToPointCloud(meshes[0], this.scene)
      } else {
        this.scene.meshes.push(meshes[0])
      }
      
      this.scene.meshes.forEach(mesh => mesh.material = this.wfMat)
    })
  }
}

class WireFrameMaterial extends BABYLON.StandardMaterial {
  constructor(color : BABYLON.Color3, scene : BABYLON.Scene) {
    super("wireframe", scene)
    this.diffuseColor = color
    this.disableLighting = true
	  this.wireframe = true
  }
}

var e : Engine

window.addEventListener("DOMContentLoaded", () => {
  e = new Engine(document.querySelector("#c") as HTMLCanvasElement)
  e.run()
})