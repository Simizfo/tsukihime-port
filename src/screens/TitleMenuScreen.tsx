import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import tsukiLogo from "../assets/game/menus/tsukihime-logo.webp"
import { AudioManager } from '../utils/AudioManager'
import '../styles/title-menu.scss'
import ParticlesComponent from '../components/ParticlesComponent'

const audio = new AudioManager()
const TitleMenuScreen = () => {

  // useEffect(() => {
  //   if (!audio.isSoundKnown("menuTheme")) {
  //     audio.setSoundFileUrl("menuTheme", "CD/track08.ogg"), 
  //     audio.playTrack("menuTheme", true)
  //   }
  // }, [])

  return (
    <div className="page" id="title-menu">
      
      <ParticlesComponent />
      <img src={tsukiLogo} alt="tsukihime logo" className="logo" />

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
    </div>
  )
}

export default TitleMenuScreen