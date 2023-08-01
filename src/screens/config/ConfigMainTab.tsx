import { useEffect, useState } from "react"
import { ConfigButtons, ConfigLayout, ResetBtn } from "../ConfigScreen"
import { defaultSettings, settings } from "../../utils/variables"
import { ViewRatio } from "../../types"
import { TEXT_SPEED } from "../../utils/constants"
import { deepAssign, negative } from "../../utils/utils"
import { FaMinus, FaPlus, FaVolumeMute, FaVolumeOff, FaVolumeUp } from "react-icons/fa"

const ConfigMainTab = () => {
  const [conf, setConf] = useState(deepAssign({
    // object only used for its structure. Values don't matter.
    volume : undefined,
    textSpeed: undefined,
    fixedRatio: undefined,
    autoClickDelay: undefined,
    nextPageDelay: undefined,
  }, settings, {createMissing: false}))

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

  const volumeNames: {[key in keyof typeof conf.volume]: string} = {
    'master': "Global volume",
    'track': "Music volume",
    'se': "SFX volume"
  }

  return (
    <section>
      {(Object.keys(conf.volume) as Array<keyof typeof volumeNames>).map(key=>
        <ConfigLayout key={key} title={`${volumeNames[key]} ${Math.abs(conf.volume[key])}`}>
          <div className="config-range">
          <span className="icon"><FaVolumeOff /></span>
            <input
              type="range"
              disabled={negative(conf.volume[key])}
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
        </ConfigLayout>
      )}

      <ConfigButtons
        title="Display ratio"
        btns={[
          { text: "Auto", value: ViewRatio.unconstrained },
          { text: "4/3", value: ViewRatio.fourByThree },
          { text: "16/9", value: ViewRatio.sixteenByNine }
        ]}
        property="fixedRatio"
        conf={conf}
        updateValue={updateValue}
      />

      <ConfigButtons
        title="Text display speed"
        btns={[
          { text: "Slow", value: TEXT_SPEED.slow },
          { text: "Medium", value: TEXT_SPEED.normal },
          { text: "Fast", value: TEXT_SPEED.fast },
          { text: "Instant", value: TEXT_SPEED.instant }
        ]}
        property="textSpeed"
        conf={conf}
        updateValue={updateValue}
      />

      <ConfigLayout title={`Auto-play text delay: ${(conf.autoClickDelay/1000).toFixed(1)}s`}>
        <div className="config-range">
        <span className="icon"><FaMinus /></span>
          <input
            type="range"
            min={0}
            max={3000}
            step={100}
            value={conf.autoClickDelay}
            onChange={e => {
              updateValue('autoClickDelay', parseInt(e.target.value))
            }} />
          <span className="icon"><FaPlus /></span>
        </div>
      </ConfigLayout>

      <ConfigLayout title={`Auto-play page delay: ${(conf.nextPageDelay/1000).toFixed(1)}s`}>
        <div className="config-range">
        <span className="icon"><FaMinus /></span>
          <input
            type="range"
            min={0}
            max={3000}
            step={100}
            value={conf.nextPageDelay}
            onChange={e => {
              updateValue('nextPageDelay', parseInt(e.target.value))
            }} />
          <span className="icon"><FaPlus /></span>
        </div>
      </ConfigLayout>

      <ResetBtn onClick={() => {
        const defaultConf = deepAssign(structuredClone(conf), defaultSettings, {createMissing: false})
        setConf(defaultConf)
      }} />
    </section>
  )
}

export default ConfigMainTab