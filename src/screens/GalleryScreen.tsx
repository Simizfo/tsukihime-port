import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Fancybox from "../components/Fancybox"
import '../styles/gallery.scss'
import { settings } from '../utils/variables'
import { motion } from 'framer-motion'
import { GALLERY_IMAGES, GalleryImg } from '../utils/gallery'
import TabBtn from '../components/TabBtn'
import strings, { imageUrl } from '../utils/lang'
import { SCREEN } from '../utils/display'

type CharacterId = keyof typeof GALLERY_IMAGES
type GalleryItem = GalleryImg & {src_sd: string, src_hd: string}

const GalleryScreen = () => {
  const [selected, setSelected] = useState<CharacterId>("ark")
  const [images, setImages] = useState<GalleryItem[]>([])
  const [defaultThumbnail] = useState(imageUrl("notreg", "sd"))

  useEffect(()=> {
    let imagesTmp: any[] = GALLERY_IMAGES[selected]
    if (imagesTmp == undefined)
      throw Error(`unknown character ${selected}`)
    
    imagesTmp = imagesTmp.map((image: GalleryImg) => {
      const name = `event/${image.img}`
      const [sd, hd] = settings.eventImages.includes(name)
                  ? [imageUrl(name, 'sd'), imageUrl(name, 'hd')]
                  : [defaultThumbnail, undefined]

      return {...image, src_sd: sd, src_hd: hd}
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
        <h2 className="page-title">{strings.title.gallery}</h2>
        <main>
          <div className="tabs">
            {(Object.keys(GALLERY_IMAGES) as Array<CharacterId>).map(character =>
              <TabBtn key={character} text={strings.characters[character]}
                active={selected === character}
                onClick={() => setSelected(character)} />
            )}
          </div>

          <Fancybox className='gallery-container'
            options={{
              Thumbs: false,
              Toolbar: false,
            }}>
            {images.map(({src_hd, src_sd, ...image}) =>
              <React.Fragment key={image.img}>
                {src_sd === defaultThumbnail ?
                  <img src={src_sd} alt="event" />
                :
                  <a href={src_hd} data-fancybox="gallery"
                    className={image.sensitive && settings.blurThumbnails ? 'blur' : ''}>
                    <img src={src_sd} alt="event" />
                  </a>
                }
              </React.Fragment>
            )}
          </Fancybox>
        </main>

        <Link to={SCREEN.EXTRA} className="menu-btn back-button">{strings.back}</Link>
      </div>
    </motion.div>
  )
}

export default GalleryScreen