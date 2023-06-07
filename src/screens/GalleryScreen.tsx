import { Link } from 'react-router-dom'
import titleMenuBg from '../assets/game/menus/title-menu-bg.png'
import { useContext, useState } from 'react'
import { store } from '../context/GameContext'

const GalleryScreen = () => {
  const { state, dispatch } = useContext(store)
  const [ selected, setSelected ] = useState("ark")

  return (
    <div id="gallery">
      <img src={titleMenuBg} alt="title menu" className="bg-image" />

      <div className='gallery-container'>
        {state.game.eventImages.map((eventImage, i) => (
          <img key={i} src={eventImage} alt="event" draggable={false} />
        ))}
      </div>

      <div className='gallery-char-container'>
        <button className='gallery-char-item' onClick={() => setSelected("ark")}>
          <img src="/image/event/ark_e02.jpg" alt="Arcueid" draggable={false} />
          <span>Arcueid</span>
        </button>

        <button className='gallery-char-item' onClick={() => setSelected("ciel")}>
          <img src="/image/event/cel_e02a.jpg" alt="Ciel" draggable={false} />
          <span>Ciel</span>
        </button>

        <button className='gallery-char-item' onClick={() => setSelected("akiha")}>
          <img src="/image/event/aki_e07a.jpg" alt="Akiha" draggable={false} />
          <span>Tohno Akiha</span>
        </button>

        <button className='gallery-char-item' onClick={() => setSelected("hisui")}>
          <img src="/image/event/koha_e01a.jpg" alt="Hisui" draggable={false} />
          <span>Hisui, Kohaku</span>
        </button>
      </div>

      <div>
        <Link to="/title" className="menu-item">Back</Link>
      </div>
    </div>
  )
}

export default GalleryScreen