import { Link } from 'react-router-dom'
import titleMenuBg from '../assets/game/menus/title-menu-bg.png'

const GalleryScreen = () => {

  return (
    <div id="gallery">
      <img src={titleMenuBg} alt="title menu" className="bg-image" />

      <div className='gallery-container'>
        <a href="" className='gallery-item'>
          <img src="/image/event/ark_e02.jpg" alt="Arcueid" />
          <span>Arcueid</span>
        </a>

        <a href="" className='gallery-item'>
          <img src="/image/event/cel_e02a.jpg" alt="Ciel" />
          <span>Ciel</span>
        </a>

        <a href="" className='gallery-item'>
          <img src="/image/event/aki_e07a.jpg" alt="Akiha" />
          <span>Tohno Akiha</span>
        </a>

        <a href="" className='gallery-item'>
          <img src="/image/event/koha_e01a.jpg" alt="Hisui" />
          <span>Hisui, Kohaku</span>
        </a>
      </div>

      <div>
        <Link to="/title" className="menu-item">Back</Link>
      </div>
    </div>
  )
}

export default GalleryScreen