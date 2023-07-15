import { useEffect, useState } from "react"
import { displayMode } from "../utils/variables"
import { observe, unobserve } from "../utils/Observer"

const SkipLayer = () => {
  const [display, setDisplay] = useState<boolean>(displayMode.skip)

  useEffect(()=> {
    observe(displayMode, 'skip', setDisplay)
    return ()=> {
      unobserve(displayMode, 'skip', setDisplay)
    }
  }, [])

  useEffect(()=> {
    if (display != displayMode.skip)
      displayMode.skip = display
  }, [display])
  
  const handleYes = () => {
    displayMode.skip = false
    //TODO: skip scene
    setDisplay(false)
  }

  const handleNo = () => {
    displayMode.skip = false
    setDisplay(false)
  }

  return (
    <div id="skip-layer" className={`box ${display ? "show" : ""}`}>
      <div className="modal">
        <div className="title">
          You have already seen this scene.<br />
          Do you want to skip it?
        </div>

        <div className="buttons">
          <button onClick={handleYes}>Yes</button>
          <button onClick={handleNo}>No</button>
        </div>
      </div>
    </div>
  )
}

export default SkipLayer