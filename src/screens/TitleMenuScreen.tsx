import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tsukiLogo from "../assets/game/menus/tsukihime-logo.webp"
import tsukiR from "../assets/game/menus/Tsukihime_blue_glass_cover.webp"
import { HiOutlineInformationCircle } from 'react-icons/hi'
import '../styles/title-menu.scss'
import ParticlesComponent from '../components/ParticlesComponent'
import { SCREEN, displayMode } from '../utils/display'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { blankSaveState, getLastSave, hasSaveStates, loadSaveFiles, loadSaveState } from '../utils/savestates'
import history from '../utils/history'
import Modal from 'react-modal';
import { APP_VERSION } from '../utils/constants'

const TitleMenuScreen = () => {
  const navigate = useNavigate()
  const [show, setShow] = useState(false)

  useEffect(()=> {
    displayMode.screen = SCREEN.TITLE
  }, [])

  function newGame() {
    loadSaveState(blankSaveState())
    navigate(SCREEN.WINDOW)
  }

  async function continueGame() {
    // restart from beginning of last visisted page ...
    const lastSave = history.last?.saveState
                // or from last saved game
                ?? getLastSave()
                // or ask user to provide save file(s).
                // Also retrieve settings from the save file(s)
                ?? await loadSaveFiles().then(getLastSave)
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

      <Modal
        isOpen={show}
        shouldCloseOnOverlayClick={true}
        onRequestClose={()=>setShow(false)}
        closeTimeoutMS={200}
        className="modal"
        overlayClassName="overlay"
        ariaHideApp={false}
      >
        <div className='title-modal'>
          <div className='links'>
            <div>
              This is a web version of <i>Tsukihime</i>, a visual novel published on 2000 by Type-Moon.
            </div>

            <div>
              English translation by <a href="http://mirrormoon.org/projects/complete/tsukihime/" target="_blank">mirror moon</a>
            </div>

            <div>
              Project available on <a href="https://github.com/requinDr/tsukihime-port" target="_blank">Github</a><br />
              v{APP_VERSION}
            </div>

            <div>
              No data collected, everything is stored in your browser.
              Manage your data <Link to="/config" state={{ tab: "Advanced" }} >here</Link>
            </div>
          </div>

          <div className='tsuki-remake'>
            <img src={tsukiR} alt="tsukihime logo" className="logo"/>

            <span>Support by buying the remake <a href="http://typemoon.com/products/tsukihime/" target="_blank">
              Tsukime - A piece of blue glass moon
            </a></span>
          </div>
        </div>

        <button className='menu-btn close-btn' onClick={()=>setShow(false)}>
          close
        </button>
      </Modal>

      <div className="logo">
        <motion.img src={tsukiLogo} alt="tsukihime logo"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: [0, 0.71, 0.2, 1.01]
          }} />
      </div>

      <nav className="menu">
        <button className='menu-item' onClick={newGame}>
          New Game
        </button>

        {hasSaveStates() &&
        <button className='menu-item' onClick={continueGame}>
          Continue
        </button>
        }

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

      <motion.button className="info-icon" onClick={()=>setShow(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: 0.6,
          duration: 1,
        }} >

        <HiOutlineInformationCircle/>
      </motion.button>
    </motion.div>
  )
}

export default TitleMenuScreen
