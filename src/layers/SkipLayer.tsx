import { useEffect, useRef, useState } from "react"
import { displayMode } from "../utils/variables"
import { useObserver } from "../utils/Observer"
import script from "../utils/script"

const SkipLayer = () => {
  const [display, setDisplay] = useState<boolean>(displayMode.skip)
  const skipConfirm = useRef<(skip:boolean)=>void>()

  useEffect(()=> {

    script.onSkipPrompt = (confirm: (skip: boolean)=>void)=> {
      displayMode.skip = true
      skipConfirm.current = confirm
    }
  }, [])

  useObserver(setDisplay, displayMode, 'skip')

  function onSelection(skip: boolean) {
    displayMode.skip = false
    skipConfirm.current?.(skip)
    skipConfirm.current = undefined
  }
  const handleYes = onSelection.bind(null, true)

  const handleNo = onSelection.bind(null, false)

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