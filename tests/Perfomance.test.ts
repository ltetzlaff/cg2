import * as test from "tape"
import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import { Octree, Octant, OctreeOptions } from "../frontend/Trees/Octree"
import { TreesUtils } from "../frontend/Trees/TreesUtils"
import { Engine } from "../frontend/engine"
const FP = TreesUtils.FindingPattern

const name = "Trees/Octree/"

/*
window.addEventListener("DOMContentLoaded", () => {
  test(name + "octree picks faster", t => {
    const canvas = document.querySelector("#c") as HTMLCanvasElement
    const e = new Engine(canvas)
    e.treeClass = "Octree"
    
    e.load("bunny.off", true)
    //{"origin":{"x":0.19330536518309366,"y":0.3068460718946124,"z":-0.2676563427794085},"direction":{"x":-0.28898835335260115,"y":-0.6074333768646103,"z":0.7399394734013103},"length":1.7976931348623157e+308}
    const ray = new BABYLON.Ray(new BABYLON.Vector3(0.2,0.3,-0.26), new BABYLON.Vector3(-.3, -.6, .7))
    
    e.findingOptions.k = 10
    e.octreeOpts.bucketSize = 50
    e.octreeOpts.maxDepth = 10
    e.octreeOpts.pointSize = new BABYLON.Vector3(.05, .05, .05)
    e.scene.executeWhenReady(() => {
      const octreeStart = Date.now()
      const octreeResults = e.tree.pick(ray, FP.KNearest, e.findingOptions)
      console.log(octreeResults)
      const octreeElapsed = Date.now() - octreeStart
      e.treeClass = "Linear"
      e.buildTree()
      const linearStart = Date.now() 
      const linearResults = e.tree.pick(ray, FP.KNearest, e.findingOptions)
      console.log(linearResults)
      const linearElapsed = Date.now() - linearStart
      console.log(octreeElapsed, linearElapsed)
      t.equal(octreeElapsed < linearElapsed, true)
      t.end()
    })
  })
})*/