import { Link } from 'react-router-dom'
import '../styles/extra.scss'
import { motion } from 'framer-motion'
import strings, { imageUrl } from '../utils/lang'
import { SCREEN } from '../utils/display'
import { settings } from '../utils/variables'


const ExtraScreen = () => {
  console.log(settings.eventImages)
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
            <div className='gallery-previews'>
              {/* todo: filter out sensitive images (don't even blur them) */}
              {/* display 8 random images */}
              {settings.eventImages.sort(() => Math.random() - 0.5).slice(0, 8).map((image, index) =>
                <img key={index} src={imageUrl(image)} alt="event" />
              )}

              {/* Placeholders */}
              {Array(Math.max(0, 8 - settings.eventImages.length)).fill(0).map((_, index) =>
                <img key={index} src={imageUrl("notreg")} alt="placeholder" />
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