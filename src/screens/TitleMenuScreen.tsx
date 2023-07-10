import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import tsukiLogo from "../assets/game/menus/tsukihime-logo.webp"
// import { audio } from "../utils/AudioManager"
import '../styles/title-menu.scss'
import ParticlesComponent from '../components/ParticlesComponent'
import { SCREEN, displayMode } from '../utils/variables'
import { motion } from 'framer-motion'

const TitleMenuScreen = () => {

  // useEffect(() => {
  //   if (!audio.isSoundKnown("menuTheme")) {
  //     audio.setSoundFileUrl("menuTheme", "CD/track08.mp3"),
  //     audio.playTrack("menuTheme", true)
  //   }
  // }, [])
  useEffect(()=> {
    displayMode.screen = SCREEN.TITLE
  }, [])
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
        <Link to="/window" className="menu-item">
          Start
        </Link>

        <Link to="/" className="menu-item">
          Quick load
        </Link>

        <Link to="/config" className="menu-item">
          Config
        </Link>

        <Link to="/gallery" className="menu-item">
          Gallery
        </Link>
      </nav>
    </motion.div>
  )
}

export default TitleMenuScreen
