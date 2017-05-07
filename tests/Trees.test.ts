import * as test from "tape"
import * as BABYLON from "../node_modules/babylonjs/babylon.module"
import { TreesUtils } from "../frontend/Trees/TreesUtils"

// Setup
const min = new BABYLON.Vector3(1, 4, 5)
const size = new BABYLON.Vector3(2, 3, 4)
const max = min.add(size)
const b = new TreesUtils.Box(min, size)

const cases = [
  { name: "v3LowestBoundary", in: min.clone(), expect: true },
  { name: "v3LowestOutside", in: min.subtract(new BABYLON.Vector3(-1, -2, -3)), expect: true },
  { name: "v3LowestOutsideClose", in: min.subtract(new BABYLON.Vector3(.1, .1, .1)), expect: false },
  { name: "v3LowestOutsideVeryClose", in: min.subtract(new BABYLON.Vector3(.001, 0, 0)), expect: false },
  { name: "v3SomewhereWithinA", in: min.add(size.scale(.2)), expect: true },
  { name: "v3SomewhereWithinB", in: min.add(size.scale(.5)), expect: true },
  { name: "v3SomewhereWithinC", in: min.add(size.scale(.8)), expect: true },
  { name: "v3HighestBoundary", in: max.clone(), expect: true },
  { name: "v3HighestOutside", in: max.add(new BABYLON.Vector3(1,2,3)), expect: false },
  { name: "v3HighestOutsideClose", in: max.add(new BABYLON.Vector3(.1,.1,.1)), expect: false },
  { name: "v3HighestOutsideVeryClose", in: max.add(new BABYLON.Vector3(0,.001,0)), expect: false }
]

test("Trees/TreesUtils/Box.contains", t => {
  cases.forEach(testCase => {
    const result = b.contains(testCase.in)
    t.equal(result, testCase.expect)
  })
  t.end()
})