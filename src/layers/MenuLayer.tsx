import { useContext, useEffect, useRef } from "react"
import { store } from "../context/GameContext"
import { addEventListener } from "../utils/utils"
import { useNavigate } from "react-router-dom"
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa"
import { IoClose } from "react-icons/io5"

/**
 * TODO
 * - scène suivante
 * - lecture auto
 * - sauvegarder
 * - charger
 */
const MenuLayer = () => {
  const { state, dispatch } = useContext(store)
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)

  //on right click disp menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (e.button === 2 && state.disp.text) {
        dispatch({ type: 'SET_DISP_MENU', payload: !state.disp.menu })
      }
    }
    return addEventListener({event: 'contextmenu', handler: handleContextMenu})
  })

  //on press escape disp menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !state.disp.history) {
        dispatch({ type: 'SET_DISP_MENU', payload: !state.disp.menu })
      }
    }
    return addEventListener({event: 'keydown', handler: handleKeyDown})
  })
  
  useEffect(() => {
    //if a left click is made outside the menu, hide it
    const handleClick = (e: MouseEvent) => {
      if (e.button === 0 && state.disp.menu && !menuRef.current?.contains(e.target as Node)) {
        dispatch({ type: 'SET_DISP_MENU', payload: false })
      }
    }
    return addEventListener({event: 'mousedown', handler: handleClick})
  })

  const graphicMode = () => {
    dispatch({ type: 'SET_DISP_MENU', payload: false })
    dispatch({ type: 'SET_DISP_HISTORY', payload: false })
    dispatch({ type: 'SET_DISP_TEXT', payload: false })
    dispatch({ type: 'SET_DISP_CHOICES', payload: false })
  }

  const historyMode = () => {
    dispatch({ type: 'SET_DISP_MENU', payload: false })
    dispatch({ type: 'SET_DISP_HISTORY', payload: true })
  }

  const title = () => {
    navigate('/title')
    dispatch({ type: 'SET_DISP_MENU', payload: false })
    dispatch({ type: 'SET_GAME', payload: { ...state.game, track: "" } })
  }

  const closeMenu = () => {
    dispatch({ type: 'SET_DISP_MENU', payload: false })
  }

  const quickSave = () => {
    localStorage.setItem('game', JSON.stringify(state.game))
    alert('Game saved!')
  }

  const quickLoad = () => {
    const game = localStorage.getItem('game')
    if (game) {
      dispatch({ type: 'SET_GAME', payload: JSON.parse(game) })
    }
  }

  const volume = () => {
    if (state.game.volume.master === 0) {
      dispatch({ type: 'SET_VOLUME', payload: { master: 1 } })
    } else {
      dispatch({ type: 'SET_VOLUME', payload: { master: 0 } })
    }
  }

  return (
    <nav className={`box box-menu ${state.disp.menu ? "show" : ""}`}>
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
              {state.game.volume.master === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
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