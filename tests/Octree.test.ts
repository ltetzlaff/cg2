import * as test from "tape"
import { Octree, Octant } from "../frontend/Trees/Octree"

const name = "Trees/Octree/"

const p1 = new BABYLON.Vector3(1, 4, 5)
const p2 = new BABYLON.Vector3(2, 3, 5)
const p3 = new BABYLON.Vector3(2, 3, 4)
const p4 = new BABYLON.Vector3(2, 3, 4.1)
const p5 = new BABYLON.Vector3(2, 3, 4.3)
const p6 = new BABYLON.Vector3(2, 3, 4.5)
const octree = new Octree([p1, p2, p3, p4, p5, p6], { maxDepth: 2, bucketSize: 2})


test(name + "splits into 8 octants", t => {
  t.equal(octree.children instanceof Array, true)
  t.equal(octree.children.length === 8, true)
  t.equal(octree.children[0] instanceof Octant, true)
  t.end()
})

test(name + "separated properly", t => {
  //console.log(JSON.stringify(octree.children, null, "<br>  "))
  const deepChildren = octree.children[4].children
  t.equal(deepChildren.length === 8, true)
  t.equal(deepChildren[4].points.length == 2, true)
  t.end()
})