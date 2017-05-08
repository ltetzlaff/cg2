import * as test from "tape"
import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import { Octree, Octant, OctreeOptions } from "../frontend/Trees/Octree"
import { TreesUtils } from "../frontend/Trees/TreesUtils"
const FP = TreesUtils.FindingPattern

const p1 = new BABYLON.Vector3(1, 4, 5)
const p2 = new BABYLON.Vector3(2, 3, 5)
const p3 = new BABYLON.Vector3(2, 3, 4)
const p4 = new BABYLON.Vector3(2, 3, 4.1)
const p5 = new BABYLON.Vector3(2, 3, 4.9)
const p6 = new BABYLON.Vector3(2, 3, 4.5)
const pOut = new BABYLON.Vector3(-2, 0, -3)
const octree = new Octree([p1, p2, p3, p4, p5, p6], new OctreeOptions(2, 2, new BABYLON.Vector3(.05, .05, .05)))


const name = "Trees/Octree/"

test(name + "splits into 8 octants", t => {
  t.equal(octree.children instanceof Array, true)
  t.equal(octree.children.length === 8, true)
  t.equal(octree.children[0] instanceof Octant, true)
  t.end()
})

test(name + "separated properly", t => {
  const deepChildren = octree.children[4].children
  t.isNotEqual(deepChildren, [])
  t.equal(octree.points.length === 0, true)
  t.equal(deepChildren.length === 8, true)
  t.equal(deepChildren[4].points.length == 2, true)
  t.end()
})

const ray = new BABYLON.Ray(p4, p6.subtract(p4))
const rayOut = new BABYLON.Ray(new BABYLON.Vector3(0,0,0), pOut.normalize())

const cases = [
  { name: "find none",
    in: {pattern: FP.KNearest, ray: rayOut, options: { radius: 0 } },
    expect: <BABYLON.Vector3[]>[] },
  { name: "find none",
    in: {pattern: FP.KNearest, ray: ray, options: { k: 0 } },
    expect: <BABYLON.Vector3[]>[] },
  { name: "find 1",
    in: {pattern: FP.Radius, ray: ray, options: { radius: 0 } },
    expect: <BABYLON.Vector3[]>[p2] },
  { name: "find 1",
    in: {pattern: FP.KNearest, ray: ray, options: { k: 1 } },
    expect: <BABYLON.Vector3[]>[p2] },
  { name: "find 1",
    in: {pattern: FP.Radius, ray: ray, options: { radius: 10e-6 } },
    expect: <BABYLON.Vector3[]>[p2] },
  { name: "find exact",
    in: {pattern: FP.KNearest, ray: ray, options: { k: 3 } },
    expect: <BABYLON.Vector3[]>[p2, p5, p1] },
  { name: "find exact",
    in: {pattern: FP.Radius, ray: ray, options: { radius: .1 } },
    expect: <BABYLON.Vector3[]>[p2, p5] }
]

test(name + "picking", t => {
  cases.forEach(testCase => {
    const i = testCase.in
    const result = octree.pick(i.ray, i.pattern, i.options)
    t.deepEqual(result.map(p => p.center), testCase.expect)
  })
  t.end()
})