import { useEffect, useState } from "react"
import { ConfigButtons, ConfigLayout, ResetBtn } from "../ConfigScreen"
import { defaultSettings, settings } from "../../utils/variables"
import { IMAGES_FOLDERS } from "../../utils/constants"
import { addEventListener, deepAssign, isFullscreen, requestJSONs, textFileUserDownload, toggleFullscreen } from "../../utils/utils"
import { SaveState, clearSaveStates, listSaveStates, restoreSaveStates } from "../../utils/savestates"

function twoDigits(n: number) {
  return n.toString().padStart(2, '0')
}

type Savefile = {
  settings: typeof settings,
  saveStates?: [number, SaveState][],
}

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

  const exportData = () => {
    const content: Savefile = {
      settings: deepAssign({}, settings),
      saveStates: listSaveStates(),
    }
    const date = new Date()
    const year = date.getFullYear(), month = date.getMonth()+1,
          day = date.getDate(), hour = date.getHours(), min = date.getMinutes()
    const dateString = [year, month, day].map(twoDigits).join('-')
    const timeString = [hour, min].map(twoDigits).join('-')
    textFileUserDownload(JSON.stringify(content), `${dateString}_${timeString}.thfull`)
  }

  const importData = async () => {
    const json = (await requestJSONs({accept: '.thfull'}) as Savefile[])?.[0] as Savefile|undefined
    if (!json)
      return
    deepAssign(settings, json.settings)
    if (json.saveStates != undefined) {
      clearSaveStates()
      restoreSaveStates(json.saveStates)
    }
  }

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

      <ConfigLayout title="Data storage">
        <div className="config-btns">
          <button className="config-btn"
            onClick={exportData}>
              Export
          </button>
          <button className="config-btn"
            onClick={importData}>
              Import
          </button>
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