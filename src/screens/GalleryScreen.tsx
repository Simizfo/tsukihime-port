import React from 'react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Fancybox from "../components/Fancybox"
import '../styles/gallery.scss'
import { settings } from '../utils/variables'
import { motion } from 'framer-motion'
import { CHARACTERS, GALLERY_IMAGES } from '../utils/gallery'
import { GalleryImg } from '../types'
import TabBtn from '../components/TabBtn'

const defaultImg = `/image/notreg.webp`

const GalleryScreen = () => {
  const [selected, setSelected] = useState<CHARACTERS>(CHARACTERS.arcueid)
  const [images, setImages] = useState<any[]>([])

  useEffect(()=> {
    let imagesTmp: any[] = []
    switch(selected) {
      case CHARACTERS.arcueid: imagesTmp = GALLERY_IMAGES.arcueid; break
      case CHARACTERS.ciel   : imagesTmp = GALLERY_IMAGES.ciel   ; break
      case CHARACTERS.akiha  : imagesTmp = GALLERY_IMAGES.akiha  ; break
      case CHARACTERS.kohaku : imagesTmp = GALLERY_IMAGES.kohaku ; break
      case CHARACTERS.hisui  : imagesTmp = GALLERY_IMAGES.hisui  ; break
      case CHARACTERS.others : imagesTmp = GALLERY_IMAGES.others ; break
      default : throw Error(`unknown character ${selected}`)
    }
    
    imagesTmp = imagesTmp.map((image: GalleryImg) => {
      const src = settings.eventImages.includes(`event/${image.img}`)
                  ? `/${settings.imagesFolder}/event/${image.img}.webp`
                  : defaultImg
      return {...image, src: src}
    })

    setImages(imagesTmp)

    document.querySelector('.gallery-container')?.scrollTo(0, 0)
  }, [selected])

  return (
    <motion.div
      className="page" id="gallery"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <h2 className="page-title">Gallery</h2>
        <main>
          <div className="tabs">
            {Object.values(CHARACTERS).map(character =>
              <TabBtn key={character} text={character}
                active={selected === character}
                onClick={() => setSelected(character)} />
            )}
          </div>

          <Fancybox className='gallery-container'
            options={{
              Thumbs: false,
              Toolbar: false,
            }}>
            {images.map((image: GalleryImg) =>
              <React.Fragment key={image.img}>
                {image.src === defaultImg ?
                  <img src={image.src} alt="event" />
                :
                  <a href={image.src} data-fancybox="gallery"
                    className={image.sensitive && settings.blurThumbnails ? 'blur' : ''}>
                    <img src={`/image/event/${image.img}.webp`} alt="event" />
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