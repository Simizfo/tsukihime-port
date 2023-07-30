import { useEffect, useState } from "react"
import { ConfigButtons, ResetBtn } from "../ConfigScreen"
import { settings } from "../../utils/variables"
import { ViewRatio } from "../../types"
import { TEXT_SPEED } from "../../utils/constants"

const defaultConf = {
  volume: {
    master: 1,
  },
  textSpeed: TEXT_SPEED.normal,
  fixedRatio: ViewRatio.unconstrained,
}

const ConfigMainTab = () => {
  const [conf, setConf] = useState({
    volume: {
      master: settings.volume.master,
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
      <div className="config">
        <div>Volume {Math.abs(conf.volume.master)}</div>

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
              updateValue('volume', { master: sign * parseInt(e.target.value) })
            }} />
          <span>High</span>
        </div>
      </div>

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