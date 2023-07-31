import { useEffect, useRef, useState } from "react"
import { addEventListener, isFullscreen, toggleFullscreen } from "../utils/utils"
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa"
import { IoClose } from "react-icons/io5"
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from "react-icons/ai"
import { SCREEN, displayMode, settings } from "../utils/variables"
import { quickLoad, quickSave } from "../utils/savestates"
import { useObserver } from "../utils/Observer"
import { useNavigate } from "react-router-dom"

/**
 * TODO
 * - scène suivante
 * - lecture auto
 * - sauvegarder
 * - charger
 */
const MenuLayer = () => {
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)
  const [display, setDisplay] = useState<boolean>(displayMode.menu)
  const [mute, setMute] = useState<boolean>(settings.volume.master < 0)
  const [fullscreen, setFullscreen] = useState<boolean>(isFullscreen())

  useObserver((display: boolean)=> {
    setDisplay(display)
    if (!display) {
      if (menuRef.current?.contains(document.activeElement))
        (document.activeElement as HTMLElement).blur?.();
    }
  }, displayMode, 'menu')

  useObserver((volume: number)=> {
    setMute(volume < 0)
  }, settings.volume, 'master')

  useEffect(() => {
    //if a left click is made outside the menu, hide it
    const handleClick = (e: MouseEvent) => {
      if (e.button === 0 && displayMode.menu && !menuRef.current?.contains(e.target as Node)) {
        displayMode.menu = false
      }
    }
    return addEventListener({event: 'mousedown', handler: handleClick})
  })

  useEffect(()=> {
    return addEventListener({event: 'fullscreenchange', handler: ()=> {
      setFullscreen(isFullscreen())
    }})
  }, [])

  const graphicMode = () => {
    displayMode.menu = false
    displayMode.history = false
    displayMode.choices = false
    displayMode.text = !displayMode.text
  }

  const historyMode = () => {
    displayMode.menu = false
    displayMode.history = true
  }

  const saveMode = () => {
    displayMode.menu = false
    displayMode.save = true
  }

  const loadMode = () => {
    displayMode.menu = false
    displayMode.load = true
  }

  const title = () => {
    navigate(SCREEN.TITLE)
    displayMode.menu = false
  }

  const closeMenu = () => {
    displayMode.menu = false
  }

  const toggleVolume = () => {
    settings.volume.master = - settings.volume.master
  }

  return (
    <nav className={`box box-menu ${display ? "show" : ""}`}>
      <div className="menu-container" ref={menuRef}>
        <menu>
          <button onClick={graphicMode}>
            Graphics
          </button>
          <button onClick={historyMode}>
            History
          </button>
          <button onClick={quickSave}>
            Quick save
          </button>
          <button onClick={quickLoad}>
            Quick load
          </button>
          <button onClick={saveMode}>
            Save
          </button>
          <button onClick={loadMode}>
            Load
          </button>
          <button onClick={title}>
            Title
          </button>

          <div className="action-icons">
            <button onClick={toggleVolume}>
              {mute ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            <button onClick={toggleFullscreen}>
              {fullscreen ? <AiOutlineFullscreenExit /> : <AiOutlineFullscreen />}
            </button>
            <button onClick={closeMenu}>
              <IoClose />
            </button>
          </div>
        </menu>
      </div>
    </nav>
  )
}

export default MenuLayer
