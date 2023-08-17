import { Link } from 'react-router-dom'
import { ReactNode, useEffect, useState } from 'react'
import '../styles/config.scss'
import { SCREEN, displayMode } from '../utils/display'
import { motion } from 'framer-motion'
import ConfigMainTab from './config/ConfigMainTab'
import ConfigAdultTab from './config/ConfigAdultTab'
import ConfigAdvancedTab from './config/ConfigAdvancedTab'
import ConfigControlsTab from './config/ConfigControlsTab'
import strings, { useLanguageRefresh } from '../utils/lang'
import TabsComponent from '../components/TabsComponent'

enum Tabs {
  main = "Main",
  adult = "Adult",
  advanced = "Advanced",
  controls = "Controls",
}

const tabComponents = {
  [Tabs.main]: <ConfigMainTab />,
  [Tabs.adult]: <ConfigAdultTab />,
  [Tabs.advanced]: <ConfigAdvancedTab />,
  [Tabs.controls]: <ConfigControlsTab />,
}

const ConfigScreen = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const [activeTab, setActiveTab] = useState(urlParams.get("tab") as Tabs || Tabs.main)
  useLanguageRefresh()

  useEffect(()=> {
    displayMode.screen = SCREEN.CONFIG
    if (!Object.hasOwn(tabComponents, activeTab))
      setActiveTab(Tabs.main)
    else {
      const baseUrl = window.location.origin + window.location.pathname
      window.history.replaceState({}, "", `${baseUrl}?tab=${activeTab}`)
    }
  }, [activeTab])

  return (
    <motion.div
      className="page" id="config"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <h2 className="page-title">Config</h2>

        <main>
          <TabsComponent tabs={Object.values(Tabs)}
            selected={activeTab} setSelected={setActiveTab} />

          {tabComponents[activeTab]}
        </main>

        <Link to={SCREEN.TITLE} className="menu-btn back-button">Back</Link>
      </div>
    </motion.div>
  )
}

export default ConfigScreen


interface ConfigLayoutProps {
  title: string
  desc?: ReactNode
  children: ReactNode
  [key:string]:any
}
export const ConfigLayout = ({ title, desc, children, ...props }: ConfigLayoutProps) => (
  <div className="config" {...props}>
    <div className="config-name">{title}</div>

    <div className="config-actions">
      {children}

      {desc &&
      <div className="desc">
        {desc}
      </div>
      }
    </div>
  </div>
)

interface ConfigButtonsProps {
  title: string
  desc?: ReactNode
  btns: { text: string; value: any }[]
  property: string
  conf: Record<string, any>
  updateValue: (key: any, value: any) => void
}
/** Display multiples options to choose from */
export const ConfigButtons = ({title, desc, btns, property, conf, updateValue}: ConfigButtonsProps) => (
  <ConfigLayout title={title} desc={desc}>
    <div className="config-btns">
      {btns.map(({text, value}) =>
        <button
          key={text}
          className={`config-btn ${conf[property] === value ? 'active' : ''}`}
          onClick={() => updateValue(property, value)}>
          {text}
        </button>
      )}
    </div>
  </ConfigLayout>
)

export const ResetBtn = ({onClick}: {onClick: ()=> void}) => (
  <div className="reset">
    <button className="menu-btn reset" onClick={onClick}>{strings.config.reset}</button>
  </div>
)