import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import '../styles/config.scss'
import { SCREEN, displayMode } from '../utils/variables'
import { motion } from 'framer-motion'
import ConfigMainTab from './config/ConfigMainTab'
import ConfigAdultTab from './config/ConfigAdultTab'
import ConfigAdvancedTab from './config/ConfigAdvancedTab'

const enum Pages {
  main,
  adult,
  advanced
}

const ConfigScreen = () => {
  const [page, setPage] = useState(Pages.main)

  useEffect(()=> {
    displayMode.screen = SCREEN.CONFIG
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
          <div className="pages">
            <PageBtn text="Main"
              active={page === Pages.main}
              onClick={() => setPage(Pages.main)} />

            <PageBtn text="Adult"
              active={page === Pages.adult}
              onClick={() => setPage(Pages.adult)} />

            <PageBtn text="Advanced"
              active={page === Pages.advanced}
              onClick={() => setPage(Pages.advanced)} />
          </div>

          {page === Pages.main &&
          <ConfigMainTab />
          }

          {page === Pages.adult &&
          <ConfigAdultTab />
          }

          {page === Pages.advanced &&
          <ConfigAdvancedTab />
          }
        </main>

        <Link to="/title" className="menu-btn back-button">Back</Link>
      </div>
    </motion.div>
  )
}

export default ConfigScreen

const PageBtn = (props: {text: string, active: boolean, onClick: ()=> void}) => (
  <button className={`page-btn ${props.active ? 'active' : ''}`}
    onClick={props.onClick}>
    {props.text}
  </button>
)

interface ConfigButtonsProps {
  title: string;
  btns: { text: string; value: any }[];
  property: string;
  conf: any;
  updateValue: (key: any, value: any) => void;
}
export const ConfigButtons = ({title, btns, property, conf, updateValue}: ConfigButtonsProps) => (
  <div className="config">
    <div>{title}</div>

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
  </div>
);

export const ResetBtn = ({onClick}: {onClick: ()=> void}) => (
  <div className="reset">
    <button className="menu-btn reset" onClick={onClick}>Reset</button>
  </div>
)