import { useEffect, useState } from "react"
import { ConfigButtons, ResetBtn } from "../ConfigScreen"
import { defaultSettings, settings } from "../../utils/variables"
import { deepAssign } from "../../utils/utils"

const ConfigAdultTab = () => {
  const [conf, setConf] = useState(deepAssign({
    blurThumbnails: undefined,
    warnHScenes: undefined,
  }, settings, {createMissing: false}))

  useEffect(()=> {
    deepAssign(settings, conf)
  }, [conf])

  const updateValue = <T extends keyof typeof conf>(
    key: T,
    value: typeof conf[T]
  ) => setConf(prev => ({ ...prev, [key]: value }))

  return (
    <section>
      <ConfigButtons
        title="Blur thumbnails"
        btns={[
          { text: 'On', value: true },
          { text: 'Off', value: false },
        ]}
        property="blurThumbnails"
        conf={conf}
        updateValue={updateValue}
      />

      <ConfigButtons
        title="Warn me when I enter an H scene"
        btns={[
          { text: 'On', value: true },
          { text: 'Off', value: false },
        ]}
        property="warnHScenes"
        conf={conf}
        updateValue={updateValue}
      />

      <ResetBtn onClick={() => {
        const defaultConf = deepAssign(structuredClone(conf), defaultSettings, {createMissing: false})
        setConf(defaultConf)
      }} />
    </section>
  )
}

export default ConfigAdultTab