import { useEffect, useState } from "react"
import { ConfigButtons, ConfigLayout, ResetBtn } from "../ConfigScreen"
import { defaultsSettings, settings } from "../../utils/variables"
import { ViewRatio } from "../../types"
import { TEXT_SPEED } from "../../utils/constants"

const defaultConf = {
  volume: defaultsSettings.volume,
  textSpeed: defaultsSettings.textSpeed,
  fixedRatio: defaultsSettings.fixedRatio,
}

const ConfigMainTab = () => {
  const [conf, setConf] = useState({
    volume: {
      master: settings.volume.master,
      track: settings.volume.track,
      se: settings.volume.se,
    },
    textSpeed: settings.textSpeed,
    fixedRatio: settings.fixedRatio,
  })

  useEffect(()=> {
    Object.assign(settings, conf)
  }, [conf])

  const updateValue = <T extends keyof typeof defaultConf>(
    key: T,
    value: typeof defaultConf[T]
  ) => setConf(prev => ({ ...prev, [key]: value }))

  return (
    <section>
      <ConfigLayout title={`Global volume ${Math.abs(conf.volume.master)}`}>
        <div className="config-range">
          <span>Low</span>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={Math.abs(conf.volume.master)}
            onChange={e => {
              const sign = (Object.is(Math.abs(conf.volume.master), conf.volume.master) ? 1 : -1)
              updateValue('volume', { ...conf.volume, master: sign * parseInt(e.target.value) })
            }} />
          <span>High</span>
        </div>
      </ConfigLayout>

      <ConfigLayout title={`Music volume ${Math.abs(conf.volume.track)}`}>
        <div className="config-range">
          <span>Low</span>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={Math.abs(conf.volume.track)}
            onChange={e => {
              const sign = (Object.is(Math.abs(conf.volume.track), conf.volume.track) ? 1 : -1)
              updateValue('volume', { ...conf.volume, track: sign * parseInt(e.target.value) })
            }} />
          <span>High</span>
        </div>
      </ConfigLayout>

      <ConfigLayout title={`SFX volume ${Math.abs(conf.volume.se)}`}>
        <div className="config-range">
          <span>Low</span>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={Math.abs(conf.volume.se)}
            onChange={e => {
              const sign = (Object.is(Math.abs(conf.volume.se), conf.volume.se) ? 1 : -1)
              updateValue('volume', { ...conf.volume, se: sign * parseInt(e.target.value) })
            }} />
          <span>High</span>
        </div>
      </ConfigLayout>

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

      <ResetBtn onClick={() => setConf(defaultConf)} />
    </section>
  )
}

export default ConfigMainTab