import { useEffect, useRef, useState } from "react"
import { displayMode } from "../utils/display"
import { useObserver } from "../utils/Observer"
import script from "../utils/script"
import { parseBBcode } from "../utils/utils"
import strings from "../utils/lang"

const SkipLayer = () => {
  const [display, setDisplay] = useState<boolean>(false)
  const [sceneTitle, setSceneTitle] = useState<string>()
  const skipConfirm = useRef<(skip:boolean)=>void>()

  useEffect(()=> {

    script.onSkipPrompt = (title: string|undefined,
                           confirm: (skip: boolean)=>void)=> {
      displayMode.skip = true
      skipConfirm.current = confirm
      setSceneTitle(title)
    }
    script.onSkipCancel = ()=> {
      displayMode.skip = false
      skipConfirm.current = undefined
    }
  }, [])
  useObserver(()=> {
    if (displayMode.skip && skipConfirm.current == undefined)
      displayMode.skip = false
    else setDisplay(displayMode.skip)
  }, displayMode, 'skip')

  function onSelection(skip: boolean) {
    displayMode.skip = false
    skipConfirm.current?.(skip)
    skipConfirm.current = undefined
  }
  const handleYes = onSelection.bind(null, true)

  const handleNo = onSelection.bind(null, false)

  return (
    <div id="skip-layer" className={`box ${display ? "show" : ""}`}>
      <div className="skip-modal">
        <div className="title">
          {sceneTitle ?<>
            {parseBBcode(strings.game["skip-named"][0])}
            <div className="scene-title">{parseBBcode(sceneTitle)}</div>
            {parseBBcode(strings.game["skip-named"][1])}  
          </> : <>
            {parseBBcode(strings.game["skip-unnamed"][1])}
          </>}
        </div>

        <div className="buttons">
          <button onClick={handleYes}>{strings.yes}</button>
          <div className="separator" />
          <button onClick={handleNo}>{strings.no}</button>
        </div>
      </div>
    </div>
  )
}

export default SkipLayer