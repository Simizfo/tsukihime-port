import { Fragment, useRef } from "react"
import { KeymapKeyFilter, inGameKeymap } from "../../utils/KeyMap"
import { useLanguageRefresh } from "../../utils/lang"

type KeyMapEntry = [string, typeof inGameKeymap[keyof typeof inGameKeymap]]

function convertAction([action, keys]: KeyMapEntry) : [string, KeymapKeyFilter[]] {
  return [
    action,
    Array.isArray(keys) ?
      keys.filter(x=>x.constructor != Function) as KeymapKeyFilter[]
    : [keys]
  ]
}

const ConfigControlsTab = () => {
  useLanguageRefresh()
  const keymap = useRef(Object.entries(inGameKeymap).map(convertAction))

  return (
    <section>
      <table><tbody>
        {keymap.current.map(([action, keys], i)=>
        <Fragment key={i}>
          {keys.map(({code, key, ctrlKey, altKey, shiftKey, repeat}, j)=>
            <tr key={`${code || key}`}>
              {j == 0 &&
                <td {...(keys.length > 1)? {rowSpan: keys.length} : {}}>
                  {action}
                </td>
              }
              <td>
                {ctrlKey ? "Ctrl + " : ""}
                {altKey ? "Alt + " : ""}
                {shiftKey ? "Shift + " : ""}
                {code || key}
              </td>
            </tr>
          )}
        </Fragment>
        )}
      </tbody></table>
    </section>
  )
}

export default ConfigControlsTab