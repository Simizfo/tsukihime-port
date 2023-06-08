import { useContext, useEffect, useRef } from "react"
import { store } from "../context/GameContext"
import { addEventListener } from "../utils/utils"
import { useNavigate } from "react-router-dom"

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
      if (e.button === 2 && !state.disp.history) {
        dispatch({ type: 'SET_DISP_MENU', payload: !state.disp.menu })
      }
    }
    return addEventListener({event: 'contextmenu', handler: handleContextMenu})
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

  const titleMenu = () => {
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
    if (state.game.volume === 0) {
      dispatch({ type: 'SET_GAME', payload: { ...state.game, volume: 1 } })
    } else {
      dispatch({ type: 'SET_GAME', payload: { ...state.game, volume: 0 } })
    }
  }

  return (
    <nav className={`box box-menu ${state.disp.menu ? "show" : ""}`}>
      <div className="menu-container" ref={menuRef}>
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
        <button onClick={titleMenu}>
          Title menu
        </button>
        <button onClick={closeMenu}>
          Close
        </button>
        <button onClick={volume}>
          {state.game.volume === 0 ? 'Unmute' : 'Mute'}
        </button>
      </div>
    </nav>
  )
}

export default MenuLayer