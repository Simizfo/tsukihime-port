import { useState } from "react"
import { ConfigBtn } from "../ConfigScreen"
import { settings } from "../../utils/variables"
import { ViewRatio } from "../../types"
import { useObserver } from '../../utils/Observer'
import { TEXT_SPEED } from "../../utils/constants"

const ConfigMainTab = () => {
  const [volume, setVolume] = useState(settings.volume.master)
  const [textSpeed, setTextSpeed] = useState(settings.textSpeed)
  const [fixedRatio, setFixedRatio] = useState(settings.fixedRatio)

  const updateVolume = (vol: number) => {
    settings.volume.master = vol
  }
  
  const updateTextSpeed = (speed: number) => {
    settings.textSpeed = speed
  }

  const updateFixedRatio = (ratio: ViewRatio) => {
    settings.fixedRatio = ratio
  }

  useObserver(setVolume, settings.volume, 'master')
  useObserver(setTextSpeed, settings, 'textSpeed')
  useObserver(setFixedRatio, settings, 'fixedRatio')

  return (
    <section>
      <div className="config">
        <div>Volume {Math.abs(volume)}</div>

        <div className="config-range">
          <span>Low</span>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={Math.abs(volume)}
            onChange={e => {
              const sign = Math.sign(volume)
              updateVolume(sign * parseInt(e.target.value))
            }} />
          <span>High</span>
        </div>
      </div>

      <div className="config">
        <div>Display ratio</div>

        <div className="config-btns">
          <ConfigBtn text="Auto"
            active={settings.fixedRatio === ViewRatio.unconstrained}
            onClick={()=> updateFixedRatio(ViewRatio.unconstrained)} />

          <ConfigBtn text="4/3"
            active={settings.fixedRatio === ViewRatio.fourByThree}
            onClick={()=> updateFixedRatio(ViewRatio.fourByThree)} />

          <ConfigBtn text="16/9"
            active={settings.fixedRatio === ViewRatio.sixteenByNine}
            onClick={()=> updateFixedRatio(ViewRatio.sixteenByNine)} />
        </div>
      </div>

      <div className="config">
        <div>Text display speed</div>

        <div className="config-btns">
          <ConfigBtn text="Slow"
            active={textSpeed === TEXT_SPEED.slow}
            onClick={()=> updateTextSpeed(TEXT_SPEED.slow)} />

          <ConfigBtn text="Medium"
            active={textSpeed === TEXT_SPEED.normal}
            onClick={()=> updateTextSpeed(TEXT_SPEED.normal)} />

          <ConfigBtn text="Fast"
            active={textSpeed === TEXT_SPEED.fast}
            onClick={()=> updateTextSpeed(TEXT_SPEED.fast)} />

          <ConfigBtn text="Instant"
            active={textSpeed === TEXT_SPEED.instant}
            onClick={()=> updateTextSpeed(TEXT_SPEED.instant)} />
        </div>
      </div>
    </section>
  )
}

export default ConfigMainTab