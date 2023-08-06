import { useEffect, useState } from "react"
import { ConfigButtons, ConfigLayout, ResetBtn } from "../ConfigScreen"
import { defaultSettings, settings } from "../../utils/variables"
import { IMAGES_FOLDERS } from "../../utils/constants"
import { addEventListener, deepAssign, isFullscreen, toggleFullscreen } from "../../utils/utils"
import { clearSaveStates } from "../../utils/savestates"

const ConfigAdvancedTab = () => {

  const [conf, setConf] = useState(deepAssign({
    imagesFolder: undefined,
  }, settings, {createMissing: false}))

  const [fullscreen, setFullscreen] = useState<boolean>(isFullscreen()) // don't save in settings

  useEffect(()=> {
    deepAssign(settings, conf)
  }, [conf])

  useEffect(()=> {
    return addEventListener({event: 'fullscreenchange', handler: ()=> {
      setFullscreen(isFullscreen())
    }})
  }, [])

  const updateValue = <T extends keyof typeof conf>(
    key: T,
    value: typeof conf[T]
  ) => setConf(prev => ({ ...prev, [key]: value }))

  const eraseData = () => {
    if (confirm("This will delete all saves, reset all settings and progress. Are you sure?")) {
      clearSaveStates()
      deepAssign(settings, defaultSettings)
      setTimeout(()=> {
        localStorage.clear()
        alert("All data have been deleted. If you leave this website without making any change"+
              " to the settings and without starting a new game, no data will remain stored"+
              " on your computer")
      }, 10) // leave room for asynchronous callbacks (if any) to complete
    }
  }

  return (
    <section>
      <ConfigButtons
        title="Quality"
        btns={[
          { text: `640\u00D7480`, value: IMAGES_FOLDERS.image },
          { text: `1280\u00D7960`, value: IMAGES_FOLDERS.image_x2 },
        ]}
        property="imagesFolder"
        conf={conf}
        updateValue={updateValue}
      />

      <ConfigButtons
        title="Fullscreen"
        btns={[
          { text: `On`, value: true },
          { text: `Off`, value: false },
        ]}
        property="fullscreen"
        conf={{fullscreen}}
        updateValue={toggleFullscreen}
      />

      <ConfigLayout title="Erase all data">
        <div className="config-btns">
          <button className="config-btn erase"
            onClick={eraseData}>
              Erase
          </button>
        </div>
      </ConfigLayout>

      <ResetBtn onClick={() => {
        const defaultConf = deepAssign(structuredClone(conf), defaultSettings, {createMissing: false})
        setConf(defaultConf)
      }} />
    </section>
  )
}

export default ConfigAdvancedTab