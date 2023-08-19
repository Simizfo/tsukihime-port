import { useLanguageRefresh } from "../../utils/lang"

const ConfigControlsTab = () => {
  useLanguageRefresh()
  return (
    <section>
      <div>
        Next: Enter/Left Click
      </div>
      <div>
        Skip: Enter/Ctrl
      </div>
      <div>
        History: Up/Left
      </div>
      <div>
        Menu: Esc/Right Click
      </div>
      <div>
        Quick Save: S
      </div>
      <div>
        Quick Load: L
      </div>
      <div>
        Move background: Ctrl + Up/Down
      </div>
    </section>
  )
}

export default ConfigControlsTab