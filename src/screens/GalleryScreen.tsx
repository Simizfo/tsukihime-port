import { Link } from 'react-router-dom'
import titleMenuBg from '../assets/game/menus/title-menu-bg.png'
import { useContext, useEffect, useState } from 'react'
import { store } from '../context/GameContext'
import { GALLERY_IMAGES } from '../utils/constants'

const GalleryScreen = () => {
  const { state } = useContext(store)
  const [images, setImages] = useState<string[]>(GALLERY_IMAGES.arcueid)

  useEffect(() => {
    handleSelected(GALLERY_IMAGES.arcueid)
  }, [])

  const handleSelected = (selectedImages: string[]) => {
    let imagesTmp = [...selectedImages]

    //all selected images that are not in the eventImages array are replaced with koha_e01a
    imagesTmp = imagesTmp.map((image) => {
      console.log(`image\\event\\${image}.jpg`)
      if (!state.game.eventImages.includes(`image\\event\\${image}.jpg`)) {
        return 'koha_e01a'
      }
      return image
    })

    setImages(imagesTmp)
  }

  return (
    <div id="gallery">
      <img src={titleMenuBg} alt="title menu" className="bg-image" />

      <div className='gallery-container'>
        {images.map((eventImage, i) => (
          <img key={eventImage + i} src={`/image/event/${eventImage}.jpg`} alt="event" draggable={false} />
        ))}
      </div>

      <div className='gallery-char-container'>
        <button className='gallery-char-item' onClick={() => handleSelected(GALLERY_IMAGES.arcueid)}>
          <img src="/image/event/ark_e02.jpg" alt="Arcueid" draggable={false} />
          <span>Arcueid</span>
        </button>

        <button className='gallery-char-item' onClick={() => handleSelected(GALLERY_IMAGES.ciel)}>
          <img src="/image/event/cel_e02a.jpg" alt="Ciel" draggable={false} />
          <span>Ciel</span>
        </button>

        <button className='gallery-char-item' onClick={() => handleSelected(GALLERY_IMAGES.akiha)}>
          <img src="/image/event/aki_e07a.jpg" alt="Akiha" draggable={false} />
          <span>Tohno Akiha</span>
        </button>

        <button className='gallery-char-item' onClick={() => handleSelected(GALLERY_IMAGES.kohaku)}>
          <img src="/image/event/koha_e01a.jpg" alt="Kohaku" draggable={false} />
          <span>Kohaku</span>
        </button>

        <button className='gallery-char-item' onClick={() => handleSelected(GALLERY_IMAGES.hisui)}>
          <img src="/image/event/his_e04.jpg" alt="Hisui" draggable={false} />
          <span>Hisui</span>
        </button>

        <button className='gallery-char-item' onClick={() => handleSelected(GALLERY_IMAGES.others)}>
          <img src="/image/bg/ima_07.jpg" alt="Others" draggable={false} />
          <span>Others</span>
        </button>
      </div>

      <div>
        <Link to="/title" className="menu-item">Back</Link>
      </div>
    </div>
  )
}

export default GalleryScreen