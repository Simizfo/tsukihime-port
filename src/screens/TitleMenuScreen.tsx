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
import { useObserved } from '../utils/Observer'

const pwaIcon = "icons/icon_128.webp"

type BeforeInstallPromptEvent = Event & {prompt: ()=>Promise<{outcome: any}>}

let sync = {
  installPWAEvent: undefined as BeforeInstallPromptEvent|undefined
}
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  sync.installPWAEvent = event as BeforeInstallPromptEvent;
});
async function installPWA() {
  if (!sync.installPWAEvent) {
    return;
  }
  const result = await sync.installPWAEvent.prompt();
  if (result.outcome == "accepted")
    sync.installPWAEvent = undefined
}

const TitleMenuScreen = () => {
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const [showPWAButton] = useObserved(sync, 'installPWAEvent', e=>e!=undefined)
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
            <img src={tsukiR} alt="tsukihime remake logo" className="logo" draggable={false} />
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
        <div className='first-row'>
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

          <Link to={SCREEN.EXTRA} className='menu-item extra'>
            {strings.title.extra}
          </Link>
        </div>

        {hasSaveStates() &&
        <div className='second-row'>
          <Link to={SCREEN.GALLERY} className="menu-item">
            {strings.extra.gallery}
          </Link>
          <Link to={SCREEN.ENDINGS} className="menu-item">
            {strings.extra.endings}
          </Link>
          <Link to="#" className="menu-item disabled" aria-disabled>
            Scenes
          </Link>
        </div>
        }
      </nav>

      {showPWAButton &&
        <motion.button
          className="pwa-install"
          aria-label="install PWA"
          onClick={installPWA}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 0.8,
            duration: 1,
          }} >
          <span>Install</span>
          <img src={pwaIcon} alt="PWA icon" draggable={false}/>
        </motion.button>
      }

      <motion.button
        className="info-icon"
        aria-label="show information modal"
        onClick={()=>setShow(true)}
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
