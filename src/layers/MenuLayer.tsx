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
    navigate('/')
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
      </div>
    </nav>
  )
}

export default MenuLayer