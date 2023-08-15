import { Link } from 'react-router-dom'
import '../styles/extra.scss'
import { motion } from 'framer-motion'
import strings, { imageUrl, useLanguageRefresh } from '../utils/lang'
import { SCREEN } from '../utils/display'
import { settings } from '../utils/variables'
import { findImageObjectByName } from '../utils/gallery'

const GALLERY_IMG_NB = 8
// get random, non sensitives images
const GALLERY_IMGS = settings.eventImages
                      .filter(image => !findImageObjectByName(image)?.sensitive)
                      .sort(() => Math.random() - 0.5)
                      .slice(0, GALLERY_IMG_NB) || []

const ExtraScreen = () => {
  useLanguageRefresh()
  
  return (
    <motion.div
      className="page" id="extra"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <h2 className="page-title">Extra</h2>
        <main>

          <section id="extra-gallery">
            <div className="gallery-previews">
              {GALLERY_IMGS.map((image, index) =>
                <img key={index} src={imageUrl(image, "sd")} alt="event" />
              )}

              {/* Placeholders */}
              {Array(Math.max(0, GALLERY_IMG_NB - GALLERY_IMGS.length)).fill(0).map((_, index) =>
                <img key={index} src={imageUrl("notreg", "sd")} alt="placeholder" />
              )}
            </div>

            <Link to={SCREEN.GALLERY} className="page-link">Gallery</Link>
          </section>
          
          <section>
            <Link to={SCREEN.ENDINGS} className="page-link">Endings</Link>
          </section>
        </main>

        <Link to={SCREEN.TITLE} className="menu-btn back-button">{strings.back}</Link>
      </div>
    </motion.div>
  )
}

export default ExtraScreen