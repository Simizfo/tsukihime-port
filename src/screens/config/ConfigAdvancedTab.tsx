import { useState } from "react"
import { ConfigBtn } from "../ConfigScreen"
import { settings } from "../../utils/variables"
import { useObserver } from '../../utils/Observer'
import { IMAGES_FOLDERS } from "../../utils/constants"

const ConfigAdvancedTab = () => {
  const [imagesFolder, setImagesFolder] = useState(settings.imagesFolder)

  const updateImagesFolder = (folder: string) => {
    settings.imagesFolder = folder as IMAGES_FOLDERS
  }

  useObserver(setImagesFolder, settings, 'imagesFolder')

  return (
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
  )
}

export default ConfigAdvancedTab