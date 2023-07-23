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

  useEffect(()=> {
    let imagesTmp: string[] = []
    switch(selected) {
      case CHARACTERS.arcueid: imagesTmp = GALLERY_IMAGES.arcueid; break
      case CHARACTERS.ciel   : imagesTmp = GALLERY_IMAGES.ciel   ; break
      case CHARACTERS.akiha  : imagesTmp = GALLERY_IMAGES.akiha  ; break
      case CHARACTERS.kohaku : imagesTmp = GALLERY_IMAGES.kohaku ; break
      case CHARACTERS.hisui  : imagesTmp = GALLERY_IMAGES.hisui  ; break
      case CHARACTERS.others : imagesTmp = GALLERY_IMAGES.others ; break
      default : throw Error(`unknown character ${selected}`)
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
  }, [selected] )

  return (
    <motion.div
      className="page" id="gallery"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <h2 className="page-title">Gallery</h2>
        <main>
          <div className="gallery-char-container">
            {Object.values(CHARACTERS).map(character=>
              <GalleryCharComponent
                key={character}
                character={character}
                selected={selected==character}
                handleSelected={setSelected}/>
            )}
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

        <Link to="/title" className="menu-btn back-button">Back</Link>
      </div>
    </motion.div>
  )
}

export default GalleryScreen