import { useEffect, useReducer, useState } from "react"
import { ConfigButtons, ConfigLayout, ResetBtn } from "../ConfigScreen"
import { defaultSettings, settings } from "../../utils/variables"
import { IMAGES_FOLDERS, SCENES_FOLDERS } from "../../utils/constants"
import { addEventListener, deepAssign, isFullscreen, requestJSONs, textFileUserDownload, toggleFullscreen } from "../../utils/utils"
import { SaveState, clearSaveStates, listSaveStates, restoreSaveStates } from "../../utils/savestates"
import strings, { languages } from "../../utils/lang"
import { useObserver } from "../../utils/Observer"

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
    language: undefined,
  }, settings, {createMissing: false}))

  const [_updateNum, forceUpdate] = useReducer(x => (x + 1) % 100, 0);
  useObserver(forceUpdate, strings, 'translation-name')

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
    if (confirm(strings.config["data-erase-warning"])) {
      clearSaveStates()
      deepAssign(settings, defaultSettings)
      setTimeout(()=> {
        localStorage.clear()
        alert(strings.config["data-erase-confirm"])
      }, 10) // leave room for asynchronous callbacks (if any) to complete
    }
  }

  return (
    <section>
      <ConfigButtons
        title={strings.config.quality}
        btns={[
          { text: strings.config["quality-sd"], value: IMAGES_FOLDERS.image },
          { text: strings.config["quality-hd"], value: IMAGES_FOLDERS.image_x2 },
        ]}
        property="imagesFolder"
        conf={conf}
        updateValue={updateValue}
      />

      <ConfigButtons
        title={strings.config.fullscreen}
        btns={[
          { text: strings.config.on, value: true },
          { text: strings.config.off, value: false },
        ]}
        property="fullscreen"
        conf={{fullscreen}}
        updateValue={toggleFullscreen}
      />

      {import.meta.env.DEV &&
      <ConfigButtons
        title={strings.config.language}
        btns={Object.entries(languages).map(([id, {"display-name": dispName}])=> {
          return {text: dispName, value: id}
        })}
        property="language"
        conf={conf}
        updateValue={updateValue}
      />
      }

      <ConfigLayout title={strings.config.data}>
        <div className="config-btns">
          <button className="config-btn"
            onClick={exportData}>
              {strings.config["data-export"]}
          </button>
          <button className="config-btn"
            onClick={importData}>
            {strings.config["data-import"]}
          </button>
          <button className="config-btn erase"
            onClick={eraseData}>
            {strings.config["data-erase"]}
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