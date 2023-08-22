import { useEffect, useState } from "react"
import { ConfigButtons, ConfigItem, ResetBtn } from "../ConfigLayout"
import { defaultSettings, settings } from "../../utils/variables"
import { deepAssign, negative } from "../../utils/utils"
import strings, { useLanguageRefresh } from "../../utils/lang"
import { FaVolumeMute, FaVolumeOff, FaVolumeUp } from "react-icons/fa"

const ConfigAudioTab = () => {
  useLanguageRefresh()
  const [conf, setConf] = useState(deepAssign({
    volume: undefined,
    trackFormat: undefined
  }, settings, {extend: false}))

  useEffect(()=> {
    deepAssign(settings, conf)
  }, [conf])

  const updateValue = <T extends keyof typeof conf>(
    key: T,
    value: typeof conf[T]
  ) => setConf(prev => ({ ...prev, [key]: value }))

  const updateSubValue = <K extends keyof typeof conf, T extends keyof (typeof conf)[K]>(
    key1: K,
    key2: T,
    value: typeof conf[K][T]
  ) => setConf(prev=> {
    const newConf = structuredClone(prev)
    newConf[key1][key2] = value
    return newConf
  })

  const volumeNames: Record<keyof typeof conf.volume, string> = {
    'master': strings.config["volume-master"],
    'track': strings.config["volume-track"],
    'se': strings.config["volume-se"]
  }

  return (
    <section>
      {(Object.keys(conf.volume) as Array<keyof typeof volumeNames>).map(key=>
        <ConfigItem key={key} title={volumeNames[key]}>
          <div className="config-range">
          <span className="icon"><FaVolumeOff /></span>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={Math.abs(conf.volume[key])}
              onChange={e => {
                const sign = negative(conf.volume[key]) ? -1 : 1
                updateSubValue('volume', key, sign * parseInt(e.target.value))
              }} />
            <span className="icon"><FaVolumeUp /></span>

            <button className="mute"
              onClick={()=> updateSubValue('volume', key, -conf.volume[key])}>
              {negative(conf.volume[key]) ? <FaVolumeMute aria-label="mute" /> : <FaVolumeUp aria-label="unmute" />}
            </button>
          </div>
        </ConfigItem>
      )}
      
      <ConfigButtons
        title={strings.config["track-source"]}
        btns={[
          { text: strings.config["track-source-original"], value: "CD_original/track$.ogg" },
          { text: strings.config["track-source-everafter"], value: "CD_everafter/track$.mp3" },
          { text: strings.config["track-source-tsukibako"], value: "CD_tsukibako/track$.ogg" }
        ]}
        property="trackFormat"
        conf={conf}
        updateValue={updateValue}
      />


      <ResetBtn onClick={() => {
        const defaultConf = deepAssign(structuredClone(conf), defaultSettings, {extend: false})
        setConf(defaultConf)
      }} />
    </section>
  )
}

export default ConfigAudioTab