import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import tsukiLogo from "../assets/images/tsukihime-logo.webp"
import tsukiR from "../assets/images/tsukihime_blue_glass_cover.webp"
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
import strings, { useLanguageRefresh } from '../utils/lang'
import { bb } from '../utils/utils'
import { RxExternalLink } from 'react-icons/rx'

const TitleMenuScreen = () => {
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  useLanguageRefresh()

  useEffect(()=> {
    displayMode.screen = SCREEN.TITLE
  }, [])

  function newGame() {
    loadSaveState(blankSaveState())
    navigate(SCREEN.WINDOW)
  }

  async function continueGame() {
    // restart from beginning of last visisted page ...
    const lastSave = history.last
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
              {bb(strings.title.about.port)}
            </div>
            {strings["translation-desc"] && <div>
              {bb(strings["translation-desc"])} <a href={strings["translation-url"]} target="_blank"><RxExternalLink /></a>
            </div>}

            <div>
              {bb(strings.title.about.project
                .replace('$0', "[url='https://github.com/requinDr/tsukihime-port']")
                .replace('$1', "[/url]"))} <br/>
              v{APP_VERSION}
            </div>

            <div>
              {bb(strings.title.about.data
                .replace('$0', "[url='/config?tab=Advanced']")
                .replace('$1', "[/url]"))}
            </div>
          </div>

          <div className='tsuki-remake'>
            <img src={tsukiR} alt="tsukihime logo" className="logo" draggable={false} />
            <span>{bb(strings.title.about.remake
                    .replace('$0', "[url='http://typemoon.com/products/tsukihime/']")
                    .replace('$1', "[/url]"))}</span>
          </div>
        </div>

        <button className='menu-btn close-btn' onClick={()=>setShow(false)}>
          {strings.title.about.close}
        </button>
      </Modal>

      <div className="logo">
        <motion.img src={tsukiLogo} alt="tsukihime logo" draggable={false}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: [0, 0.71, 0.2, 1.01]
          }} />
      </div>

      <nav className="menu">
        <button className='menu-item' onClick={newGame}>
          {strings.title.start}
        </button>

        {hasSaveStates() &&
        <button className='menu-item' onClick={continueGame}>
          {strings.title.resume}
        </button>
        }

        <Link to={SCREEN.LOAD} className="menu-item">
          {strings.title.load}
        </Link>

        <Link to={SCREEN.CONFIG} className="menu-item">
          {strings.title.config}
        </Link>

        <Link to={SCREEN.EXTRA} className="menu-item">
          {strings.title.extra}
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
