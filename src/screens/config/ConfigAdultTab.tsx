import { useEffect, useState } from "react"
import { ConfigButtons, ResetBtn } from "../ConfigScreen"
import { settings } from "../../utils/variables"

const defaultConf = {
  blurThumbnails: true,
  warnHScenes: false
}

const ConfigAdultTab = () => {
  const [conf, setConf] = useState({
    blurThumbnails: settings.blurThumbnails,
    warnHScenes: settings.warnHScenes,
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

      <ResetBtn onClick={() => setConf(defaultConf)} />
    </section>
  )
}

export default ConfigAdultTab