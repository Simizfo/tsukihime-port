import { Link } from 'react-router-dom'
import '../styles/endings.scss'
import { motion } from 'framer-motion'
import strings, { useLanguageRefresh } from '../utils/lang'
import { SCREEN } from '../utils/display'
import chalkboard from '../assets/images/chalkboard.webp'
import { wbb } from '../utils/utils'
import { RouteEnding, endings, osiete } from '../utils/endings'
import { Tooltip } from 'react-tooltip'
import { settings } from '../utils/variables'
import ReactDOMServer from 'react-dom/server';

const imgPrefix = "/image/event/"
// settings.completedScenes.push("s521")
const EndingsScreen = () => {
  useLanguageRefresh()

  return (
    <motion.div
      className="page" id="endings"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <h2 className="page-title">Endings</h2>
        <main>

          <div className="endings-list">
          {Object.values(endings).map((ending, index) => {
            if (ending.seen) {
              return <EndingComponent ending={ending} key={index} />
            } else {
              return <div key={index} className="ending" />
            }
          })}
          </div>

          <div className="badendings-list">
            <h3>{strings.endings.osiete}</h3>
            <Tooltip id="osiete" place="top" className="tooltip" />
            {Object.values(osiete).map((ending, index)=>
              <div key={index} className={`badending ${ending?.seen ? 'seen' : ''}`}>
                {ending?.seen ? <img src={chalkboard} alt={`Bad Ending ${ending.scene}`} draggable={false}
                                  data-tooltip-id="osiete"
                                  data-tooltip-html={ReactDOMServer.renderToStaticMarkup(
                                  <div>
                                    {wbb(ending.name)}<br />
                                    Day: {ending.day}
                                  </div>)} />
                : <img src={chalkboard} alt="Bad Ending" draggable={false} />
                }
              </div>
            )}
          </div>
        </main>

        <Link to={SCREEN.EXTRA} className="menu-btn back-button">{strings.back}</Link>
      </div>
    </motion.div>
  )
}

export default EndingsScreen

const EndingComponent = ({ending:{char, image, name, day, type}}: {ending: RouteEnding}) => {
  return (
    <div className={`ending ${char}`}>
      <img className="ending-img" src={`${imgPrefix}${image}.webp`}
        alt={name} draggable={false} />
      <div className="ending-name">{wbb(strings.scenario.routes[char][day])}</div>
      <div className="ending-bottom">
        <div>{strings.characters[char]}</div>
        <div className="ending-type">{type}</div>
      </div>
    </div>
  )
}