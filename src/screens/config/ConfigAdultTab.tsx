import { useState } from "react"
import { ConfigBtn } from "../ConfigScreen"
import { settings } from "../../utils/variables"
import { useObserver } from '../../utils/Observer'

const ConfigAdultTab = () => {
  const [galleryBlur, setGalleryBlur] = useState(settings.galleryBlur)

  const updateGalleryBlur = (blur: boolean)=> {
    settings.galleryBlur = blur
  }

  useObserver(setGalleryBlur, settings, 'galleryBlur')

  return (
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
  )
}

export default ConfigAdultTab