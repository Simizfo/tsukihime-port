import { useEffect, useState } from "react"
import { ConfigButtons, ResetBtn } from "../ConfigScreen"
import { settings } from "../../utils/variables"

const defaultConf = {
  galleryBlur: true,
}

const ConfigAdultTab = () => {
  const [conf, setConf] = useState({
    galleryBlur: settings.galleryBlur,
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
        property="galleryBlur"
        conf={conf}
        updateValue={updateValue}
      />

      <ResetBtn onClick={() => setConf(defaultConf)} />
    </section>
  )
}

export default ConfigAdultTab