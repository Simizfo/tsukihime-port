import { useEffect, useRef, useState } from "react"
import { addEventListener } from "../utils/utils"
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa"
import { IoClose } from "react-icons/io5"
import { SCREEN, createSaveState, displayMode, loadSaveState, settings } from "../utils/variables"
import { observe, unobserve } from "../utils/Observer"
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
  const [mute, setMute] = useState<boolean>(settings.volume.master == 0)

  useEffect(()=> {
    const callback = ()=> {
      setDisplay(displayMode.menu)
      setMute(settings.volume.master == 0)
    }
    observe(displayMode, 'menu', callback)
    observe(settings.volume, 'master', callback)
    return ()=> {
      unobserve(displayMode, 'menu', callback)
      unobserve(settings.volume, 'master', callback)
    }
  }, [])

  //on right click disp menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (e.button === 2 && displayMode.text) {
        displayMode.menu = !displayMode.menu
      }
    }
    return addEventListener({event: 'contextmenu', handler: handleContextMenu})
  })

  //on press escape disp menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !displayMode.history) {
        displayMode.menu = !displayMode.menu
      }
    }
    return addEventListener({event: 'keydown', handler: handleKeyDown})
  })
  
  useEffect(() => {
    //if a left click is made outside the menu, hide it
    const handleClick = (e: MouseEvent) => {
      if (e.button === 0 && displayMode.menu && !menuRef.current?.contains(e.target as Node)) {
        displayMode.menu = false
      }
    }
    return addEventListener({event: 'mousedown', handler: handleClick})
  })

  const graphicMode = () => {
    displayMode.menu = false
    displayMode.history = false
    displayMode.choices = false
    displayMode.text = false
  }

  const historyMode = () => {
    displayMode.menu = false
    displayMode.history = true
  }

  const title = () => {
    navigate(SCREEN.TITLE)
    displayMode.menu = false
  }

  const closeMenu = () => {
    displayMode.menu = false
  }

  const quickSave = () => {
    const saveState = createSaveState()
    localStorage.setItem('game', JSON.stringify(saveState))
    alert('Game saved!')
  }

  const quickLoad = () => {
    const saveState = localStorage.getItem('game')
    if (saveState) {
      loadSaveState(JSON.parse(saveState))
    }
  }

  const volume = () => {
    console.log("volume : ", settings.volume.master)
    settings.volume.master = (settings.volume.master > 0 ? 0 : 1)
    console.log("volume : ", settings.volume.master)
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
          <button onClick={title}>
            Title
          </button>
          <div className="action-icons">
            <button onClick={volume}>
              {mute ? <FaVolumeMute /> : <FaVolumeUp />}
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