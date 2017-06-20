import { App } from "./App/App"

window.addEventListener("DOMContentLoaded", () => {
  const e = new App(document.querySelector("#c") as HTMLCanvasElement)
  e.setupUIBindings()
  e.run()  
})