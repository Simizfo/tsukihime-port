import { useEffect, useState } from "react"
import { ConfigButtons, ResetBtn } from "../ConfigLayout"
import { defaultSettings, settings } from "../../utils/variables"
import { deepAssign } from "../../utils/utils"
import strings, { useLanguageRefresh } from "../../utils/lang"

const ConfigAdultTab = () => {
  useLanguageRefresh()
  const [conf, setConf] = useState(deepAssign({
    blurThumbnails: undefined,
    warnHScenes: undefined,
  }, settings, {extend: false}))

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
        title={strings.config["adult-blur"]}
        btns={[
          { text: strings.config.on, value: true },
          { text: strings.config.off, value: false },
        ]}
        property="blurThumbnails"
        conf={conf}
        updateValue={updateValue}
      />

      <ConfigButtons
        title={strings.config["adult-warn"]}
        btns={[
          { text: strings.config.on, value: true },
          { text: strings.config.off, value: false },
        ]}
        property="warnHScenes"
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

export default ConfigAdultTab