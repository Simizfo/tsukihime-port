import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import '../styles/config.scss'
import { IMAGES_FOLDERS, TEXT_SPEED } from '../utils/constants'
import { SCREEN, displayMode, settings } from '../utils/variables'
import { useObserver } from '../utils/Observer'
import { motion } from 'framer-motion'
import { ViewRatio } from '../types'

const enum Pages {
  main,
  adult,
  advanced
}

const ConfigScreen = () => {

  const [page, setPage] = useState(Pages.main)
  const [volume, setVolume] = useState(settings.volume.master)
  const [imagesFolder, setImagesFolder] = useState(settings.imagesFolder)
  const [textSpeed, setTextSpeed] = useState(settings.textSpeed)
  const [galleryBlur, setGalleryBlur] = useState(settings.galleryBlur)

  useEffect(()=> {
    displayMode.screen = SCREEN.CONFIG
  }, [])

  const updateVolume = (vol: number) => {
    settings.volume.master = vol
  }

  const updateImagesFolder = (folder: string) => {
    settings.imagesFolder = folder as IMAGES_FOLDERS
  }

  const updateTextSpeed = (speed: number) => {
    settings.textSpeed = speed
  }

  const updateGalleryBlur = (blur: boolean)=> {
    settings.galleryBlur = blur
  }

  const updateFixedRatio = (ratio: ViewRatio) => {
    settings.fixedRatio = ratio
  }

  useObserver(setVolume, settings.volume, 'master')
  useObserver(setImagesFolder, settings, 'imagesFolder')
  useObserver(setTextSpeed, settings, 'textSpeed')
  useObserver(setGalleryBlur, settings, 'galleryBlur')

  return (
    <motion.div
      className="page" id="config"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <h2 className="page-title">Config</h2>
        <main>
          <div className="pages">
            <PageBtn text="Main" active={page === Pages.main} onClick={() => setPage(Pages.main)} />

            <PageBtn text="Adult" active={page === Pages.adult} onClick={() => setPage(Pages.adult)} />

            <PageBtn text="Advanced" active={page === Pages.advanced} onClick={() => setPage(Pages.advanced)} />
          </div>

          {page === Pages.main &&
          <section>
            <div className="config">
              <div>Volume {Math.abs(volume)}</div>

              <div>
                Low
                <input
                  type="range"
                  min="0"
                  max="10"
                  step={1}
                  value={Math.abs(volume)}
                  onChange={(e) => {
                    const sign = Math.sign(volume)
                    updateVolume(sign * parseInt(e.target.value))
                  }} />
                High
              </div>
            </div>

            <div className="config">
              <div>Display ratio</div>

              <div className="config-btns">
                <ConfigBtn text="Unconstrained"
                  active={settings.fixedRatio === ViewRatio.unconstrained}
                  onClick={()=> updateFixedRatio(ViewRatio.unconstrained)} />

                <ConfigBtn text="4/3"
                  active={settings.fixedRatio === ViewRatio.fourByThree}
                  onClick={()=> updateFixedRatio(ViewRatio.fourByThree)} />

                <ConfigBtn text="16/9"
                  active={settings.fixedRatio === ViewRatio.sixteenByNine}
                  onClick={()=> updateFixedRatio(ViewRatio.sixteenByNine)} />
              </div>
            </div>

            <div className="config">
              <div>Text display speed</div>

              <div className="config-btns">
                <ConfigBtn text="Slow"
                  active={textSpeed === TEXT_SPEED.slow}
                  onClick={()=> updateTextSpeed(TEXT_SPEED.slow)} />

                <ConfigBtn text="Medium"
                  active={textSpeed === TEXT_SPEED.normal}
                  onClick={()=> updateTextSpeed(TEXT_SPEED.normal)} />

                <ConfigBtn text="Fast"
                  active={textSpeed === TEXT_SPEED.fast}
                  onClick={()=> updateTextSpeed(TEXT_SPEED.fast)} />

                <ConfigBtn text="Instant"
                  active={textSpeed === TEXT_SPEED.instant}
                  onClick={()=> updateTextSpeed(TEXT_SPEED.instant)} />
              </div>
            </div>
          </section>
          }

          {page === Pages.adult &&
          <section>
            <div className="config">
              <div>Blur thumbnails</div>

              <div className="config-btns">
                <ConfigBtn text="On"
                  active={galleryBlur}
                  onClick={()=> updateGalleryBlur(true)} />

                <ConfigBtn text="Off"
                  active={!galleryBlur}
                  onClick={()=> updateGalleryBlur(false)} />
              </div>
            </div>
          </section>
          }

          {page === Pages.advanced &&
          <section>
            <div className="config">
              <div>Quality</div>
              
              <div className="config-btns">
                <ConfigBtn text={`640\u00D7480`}
                  active={imagesFolder === IMAGES_FOLDERS.image}
                  onClick={()=> updateImagesFolder(IMAGES_FOLDERS.image)} />

                <ConfigBtn text={`1280\u00D7960`}
                  active={imagesFolder === IMAGES_FOLDERS.image_x2}
                  onClick={()=> updateImagesFolder(IMAGES_FOLDERS.image_x2)} />
              </div>
            </div>
          </section>
          }
        </main>

        <Link to="/title" className="menu-btn back-button">Back</Link>
      </div>
    </motion.div>
  )
}

export default ConfigScreen

const PageBtn = (props: {text: string, active: boolean, onClick: ()=> void}) => (
  <button className={`page-btn ${props.active ? 'active' : ''}`}
    onClick={props.onClick}>
    {props.text}
  </button>
)

const ConfigBtn = (props: {text: string, active: boolean, onClick: ()=> void}) => (
  <button className={`config-btn ${props.active ? 'active' : ''}`}
    onClick={props.onClick}>
    {props.text}
  </button>
)