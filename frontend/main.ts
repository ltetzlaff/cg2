import { Engine } from "./engine"

var e : Engine
window.addEventListener("DOMContentLoaded", () => {
  e = new Engine(document.querySelector("#c") as HTMLCanvasElement)
  e.setupUIBindings()
  e.run()  
})