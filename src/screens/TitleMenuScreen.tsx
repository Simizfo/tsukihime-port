import { Link } from 'react-router-dom'
import titleMenuBg from '../assets/game/menus/title-menu-bg.png'

const TitleMenuScreen = () => {
  return (
    <div id="title-menu">
      <img src={titleMenuBg} alt="title menu" className="bg-image" />

      <nav className="menu">
        <Link to="/window" className="menu-item">
          Start
        </Link>

        <Link to="/" className="menu-item">
          Quick load
        </Link>

        <Link to="/" className="menu-item">
          Gallery
        </Link>
      </nav>
    </div>
  )
}

export default TitleMenuScreen