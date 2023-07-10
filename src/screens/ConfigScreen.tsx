import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import '../styles/config.scss'
import { IMAGES_FOLDERS, TEXT_SPEED } from '../utils/constants'
import { SCREEN, displayMode, settings } from '../utils/variables'
import { observe, unobserve } from '../utils/Observer'
import { motion } from 'framer-motion'

const ConfigScreen = () => {
  
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

  useEffect(()=> {
    observe(settings.volume, 'master', setVolume)
    observe(settings, 'imagesFolder', setImagesFolder)
    observe(settings, 'textSpeed', setTextSpeed)
    observe(settings, 'galleryBlur', setGalleryBlur)
    return ()=> {
      unobserve(settings.volume, 'master', setVolume)
      unobserve(settings, 'imagesFolder', setImagesFolder)
      unobserve(settings, 'textSpeed', setTextSpeed)
      unobserve(settings, 'galleryBlur', setGalleryBlur)
    }
  }, [])

  return (
    <motion.div
      className="page" id="config"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <main>
          <div>
            Volume: {settings.volume.master}
            <input
              type="range"
              min="0"
              max="10"
              step={1}
              value={volume}
              onChange={(e) => updateVolume(parseInt(e.target.value))} />
          </div>

          <div>
            Quality: 
            <select
              value={imagesFolder}
              onChange={(e) => updateImagesFolder(e.target.value)}>
              <option value={IMAGES_FOLDERS.image}>640x480 (original)</option>
              <option value={IMAGES_FOLDERS.image_x2}>1280x960</option>
            </select>
          </div>

          <div>
            Text speed:
            <select
              value={textSpeed}
              onChange={(e) => updateTextSpeed(parseInt(e.target.value))}>
              <option value={TEXT_SPEED.instant}>Instant</option>
              <option value={TEXT_SPEED.fast}>Fast</option>
              <option value={TEXT_SPEED.normal}>Medium</option>
              <option value={TEXT_SPEED.slow}>Slow</option>
            </select>
          </div>

          <div>
            Blur gallery thumbnails:
            <input
              type="checkbox"
              checked={galleryBlur}
              onChange={(e) => updateGalleryBlur(e.target.checked)} />
          </div>
        </main>

        <Link to="/title" className="back-button">Back</Link>
      </div>
    </motion.div>
  )
}

export default ConfigScreen