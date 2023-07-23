import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import tsukiLogo from "../assets/game/menus/tsukihime-logo.webp"
import '../styles/title-menu.scss'
import ParticlesComponent from '../components/ParticlesComponent'
import { SCREEN, displayMode, gameContext } from '../utils/variables'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { blankSaveState, getLastSave, loadSaveFile, loadSaveState } from '../utils/savestates'
import script from '../utils/script'

const TitleMenuScreen = () => {
  const navigate = useNavigate()
  // useEffect(() => {
  //   if (!audio.isSoundKnown("menuTheme")) {
  //     audio.setSoundFileUrl("menuTheme", "CD/track08.mp3"),
  //     audio.playTrack("menuTheme", true)
  //   }
  // }, [])
  useEffect(()=> {
    displayMode.screen = SCREEN.TITLE
  }, [])

  function newGame() {
    loadSaveState(blankSaveState())
    navigate(SCREEN.WINDOW)
  }
  
  async function continueGame() {
    
    // restart from beginning of last visisted page ...
    let lastSave = script.history.top?.saveState
                // or from last saved game
                ?? getLastSave()
                // or ask user to provide save file(s).
                // Also retrieve settings from the save file(s)
                ?? await loadSaveFile().then(getLastSave)
    if (lastSave) {
      loadSaveState(lastSave)
      navigate(SCREEN.WINDOW)
    }
  }

  return (
    <motion.div
      className="page" id="title-menu"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>

      <ParticlesComponent />
      <motion.img src={tsukiLogo} alt="tsukihime logo" className="logo"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.8,
          ease: [0, 0.71, 0.2, 1.01]
        }} />

      <nav className="menu">
        <button className='menu-item' onClick={newGame}>New Game</button>
        <button className='menu-item' onClick={continueGame}>Continue</button>

        <Link to={SCREEN.LOAD} className="menu-item">
          Load
        </Link>

        <Link to={SCREEN.CONFIG} className="menu-item">
          Config
        </Link>

        <Link to={SCREEN.GALLERY} className="menu-item">
          Gallery
        </Link>
      </nav>
    </motion.div>
  )
}

export default TitleMenuScreen
