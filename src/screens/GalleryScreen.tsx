import React from 'react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { CHARACTERS, GALLERY_IMAGES, IMAGES_FOLDERS } from '../utils/constants'
import GalleryCharComponent from '../components/GalleryCharComponent'
import Fancybox from "../components/Fancybox"
import '../styles/gallery.scss'
import { settings } from '../utils/variables'
import { motion } from 'framer-motion'

const defaultImg = "/image_x2/notreg.webp"

const GalleryScreen = () => {
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
      const extension = settings.imagesFolder === IMAGES_FOLDERS.image ? 'jpg' : 'webp'
      if (!settings.eventImages.includes(`event/${image}`)) {
        return defaultImg
      } else {
        return `/${settings.imagesFolder}/event/${image}.${extension}`
      }
    })

    setImages(imagesTmp)

    document.querySelector('.gallery-container')?.scrollTo(0, 0)
  }

  return (
    <motion.div
      className="page" id="gallery"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <main>
          <div className="gallery-char-container">
            <GalleryCharComponent
              character={CHARACTERS.arcueid}
              selected={selected}
              handleSelected={handleSelected} />

            <GalleryCharComponent
              character={CHARACTERS.ciel}
              selected={selected}
              handleSelected={handleSelected} />

            <GalleryCharComponent
              character={CHARACTERS.akiha}
              selected={selected}
              handleSelected={handleSelected} />

            <GalleryCharComponent
              character={CHARACTERS.kohaku}
              selected={selected}
              handleSelected={handleSelected} />

            <GalleryCharComponent
              character={CHARACTERS.hisui}
              selected={selected}
              handleSelected={handleSelected} />

            <GalleryCharComponent
              character={CHARACTERS.others}
              selected={selected}
              handleSelected={handleSelected} />
          </div>

          <Fancybox className='gallery-container'
            options={{
              Thumbs: false,
              Toolbar: false,
            }}>
            {images.map((eventImage, i) =>
              <React.Fragment key={eventImage + i}>
                {eventImage === defaultImg ?
                  <img src={eventImage} alt="event" />
                :
                  <a href={eventImage} data-fancybox="gallery"
                    className={eventImage.includes('_h') && settings.galleryBlur ? 'h' : ''}>
                    <img src={eventImage} alt="event" />
                  </a>
                }
              </React.Fragment>
            )}
          </Fancybox>
        </main>

        <Link to="/title" className="back-button">Back</Link>
      </div>
    </motion.div>
  )
}

export default GalleryScreen