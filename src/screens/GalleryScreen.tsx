import { Link } from 'react-router-dom'
import titleMenuBg from '../assets/game/menus/title-menu-bg.png'
import { useContext, useEffect, useState } from 'react'
import { store } from '../context/GameContext'
import { CHARACTERS, GALLERY_IMAGES } from '../utils/constants'
import GalleryCharComponent from '../components/GalleryCharComponent'

const GalleryScreen = () => {
  const { state } = useContext(store)
  const [selected, setSelected] = useState<CHARACTERS>(CHARACTERS.arcueid)
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    handleSelected(CHARACTERS.arcueid)
  }, [])

  const handleSelected = (selectedChar: CHARACTERS) => {
    let imagesTmp: string[] = []

    switch (selectedChar) {
      case CHARACTERS.arcueid:
        setSelected(CHARACTERS.arcueid)
        imagesTmp = GALLERY_IMAGES.arcueid
        break
      case CHARACTERS.ciel:
        setSelected(CHARACTERS.ciel)
        imagesTmp = GALLERY_IMAGES.ciel
        break
      case CHARACTERS.akiha:
        setSelected(CHARACTERS.akiha)
        imagesTmp = GALLERY_IMAGES.akiha
        break
      case CHARACTERS.kohaku:
        setSelected(CHARACTERS.kohaku)
        imagesTmp = GALLERY_IMAGES.kohaku
        break
      case CHARACTERS.hisui:
        setSelected(CHARACTERS.hisui)
        imagesTmp = GALLERY_IMAGES.hisui
        break
      case CHARACTERS.others:
        setSelected(CHARACTERS.others)
        imagesTmp = GALLERY_IMAGES.others
        break
    }

    imagesTmp = imagesTmp.map((image) => {
      const extension = state.permanent.imagesFolder === 'image' ? 'jpg' : 'webp'
      if (!state.permanent.eventImages.includes(`image\\event\\${image}.jpg`)) {
        return "/image/gallery/notreg.jpg"
      } else {
        return `/${state.permanent.imagesFolder}/event/${image}.${extension}`
      }
    })

    setImages(imagesTmp)
  }

  return (
    <div id="gallery">
      <div className="page-content">
        <img src={titleMenuBg} alt="title menu" className="bg-image" />

        <h2 className="title">Gallery</h2>

        <main>
          <div className='gallery-container'>
            {images.map((eventImage, i) => (
              <img key={eventImage + i} src={eventImage} alt="event" draggable={false} />
            ))}
          </div>

          <div className="gallery-char-container">
            <GalleryCharComponent
              character={CHARACTERS.arcueid}
              background='/image/event/ark_e02.jpg'
              selected={selected}
              handleSelected={handleSelected} />

            <GalleryCharComponent
              character={CHARACTERS.ciel}
              background='/image/event/cel_e02a.jpg'
              selected={selected}
              handleSelected={handleSelected} />

            <GalleryCharComponent
              character={CHARACTERS.akiha}
              background='/image/event/aki_e07a.jpg'
              selected={selected}
              handleSelected={handleSelected} />

            <GalleryCharComponent
              character={CHARACTERS.kohaku}
              background='/image/event/koha_e01a.jpg'
              selected={selected}
              handleSelected={handleSelected} />

            <GalleryCharComponent
              character={CHARACTERS.hisui}
              background='/image/event/his_e04.jpg'
              selected={selected}
              handleSelected={handleSelected} />

            <GalleryCharComponent
              character={CHARACTERS.others}
              background='/image/bg/ima_07.jpg'
              selected={selected}
              handleSelected={handleSelected} />
          </div>
        </main>

        <Link to="/title" className="back-button">Back</Link>
      </div>
    </div>
  )
}

export default GalleryScreen