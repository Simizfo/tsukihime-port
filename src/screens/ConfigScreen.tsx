import { Link } from 'react-router-dom'
import { useContext, useEffect, useState } from 'react'
import { store } from '../context/GameContext'
import '../styles/config.scss'
import { IMAGES_FOLDERS, TEXT_SPEED } from '../utils/constants'

const ConfigScreen = () => {
  const { state, dispatch } = useContext(store)

  const setVolume = (vol: number) => {
    dispatch({ type: 'SET_VOLUME', payload: { master: vol } })
  }

  const setImagesFolder = (folder: string) => {
    dispatch({ type: 'SET_PERMANENT', payload: { imagesFolder: folder } })
  }

  const setTextSpeed = (speed: number) => {
    dispatch({ type: 'SET_PERMANENT', payload: { textSpeed: speed } })
  }

  return (
    <div className="page" id="config">
      <div className="page-content">
        <main>
          <div>
            Volume: {state.game.volume.master}
            <input
              type="range"
              min="0"
              max="10"
              step={1}
              value={state.game.volume.master}
              onChange={(e) => setVolume(parseInt(e.target.value))} />
          </div>

          <div>
            Quality: 
            <select
              value={state.permanent.imagesFolder}
              onChange={(e) => setImagesFolder(e.target.value)}>
              <option value={IMAGES_FOLDERS.image}>640x480 (original)</option>
              <option value={IMAGES_FOLDERS.image_x2}>1280x960</option>
            </select>
          </div>

          <div>
            Text speed:
            <select
              value={state.permanent.textSpeed}
              onChange={(e) => setTextSpeed(parseInt(e.target.value))}>
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
              checked={state.permanent.galleryBlur}
              onChange={(e) => dispatch({ type: 'SET_PERMANENT', payload: { galleryBlur: e.target.checked } })} />
          </div>
        </main>

        <Link to="/title" className="back-button">Back</Link>
      </div>
    </div>
  )
}

export default ConfigScreen