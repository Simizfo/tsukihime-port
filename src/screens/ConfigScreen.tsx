import { Link, useLocation, useParams } from 'react-router-dom'
import { ReactNode, useEffect, useState } from 'react'
import '../styles/config.scss'
import { SCREEN, displayMode } from '../utils/variables'
import { motion } from 'framer-motion'
import ConfigMainTab from './config/ConfigMainTab'
import ConfigAdultTab from './config/ConfigAdultTab'
import ConfigAdvancedTab from './config/ConfigAdvancedTab'
import ConfigControlsTab from './config/ConfigControlsTab'
import TabBtn from '../components/TabBtn'

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
  const { state } = useLocation()
  const [activeTab, setActiveTab] = useState(state?.tab as Tabs || Tabs.main)

  useEffect(()=> {
    displayMode.screen = SCREEN.CONFIG
    window.history.replaceState({}, document.title) //clean state
  }, [])

  return (
    <motion.div
      className="page" id="config"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <h2 className="page-title">Config</h2>

        <main>
          <div className="tabs">
            {Object.values(Tabs).map(tabBtn =>
              <TabBtn key={tabBtn} text={tabBtn}
                active={tabBtn === activeTab}
                onClick={() => setActiveTab(tabBtn)} />
            )}
          </div>

          {tabComponents[activeTab]}
        </main>

        <Link to="/title" className="menu-btn back-button">Back</Link>
      </div>
    </motion.div>
  )
}

export default ConfigScreen


interface ConfigLayoutProps {
  title: string
  children: ReactNode
  [key:string]:any
}
export const ConfigLayout = ({ title, children, ...props }: ConfigLayoutProps) => (
  <div className="config" {...props}>
    <div>{title}</div>

    {children}
  </div>
)

interface ConfigButtonsProps {
  title: string
  btns: { text: string; value: any }[]
  property: string
  conf: any
  updateValue: (key: any, value: any) => void
}
/** Display multiples options to choose from */
export const ConfigButtons = ({title, btns, property, conf, updateValue}: ConfigButtonsProps) => (
  <ConfigLayout title={title}>
    <div className="config-btns">
      {btns.map(btn =>
        <button
          key={btn.text}
          className={`config-btn ${conf[property] === btn.value ? 'active' : ''}`}
          onClick={() => updateValue(property, btn.value)}>
          {btn.text}
        </button>
      )}
    </div>
  </ConfigLayout>
)

export const ResetBtn = ({onClick}: {onClick: ()=> void}) => (
  <div className="reset">
    <button className="menu-btn reset" onClick={onClick}>Reset</button>
  </div>
)