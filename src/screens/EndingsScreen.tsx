import { Link } from 'react-router-dom'
import '../styles/endings.scss'
import { motion } from 'framer-motion'
import strings from '../utils/lang'
import { SCREEN } from '../utils/display'
import { completion, settings } from '../utils/variables'
import chalkboard from '../assets/images/chalkboard.webp'
import { wbb } from '../utils/utils'

const imgPrefix = "/image/event/"
const EndingsScreen = () => {
  const endings = [
    {name: "13b", character: "aki", type: strings.endings.normal, img: "aki_f01", viewed: completion.akiha_good},
    {name: "13a", character: "aki", type: strings.endings.true, img: "aki_f02", viewed: completion.akiha_true},
    {name: "13b", character: "ark", type: strings.endings.good, img: "ark_f02", viewed: completion.ark_good},
    {name: "13a", character: "ark", type: strings.endings.true, img: "ark_f03", viewed: completion.ark_true},
    {name: "13b", character: "cel", type: strings.endings.good, img: "cel_e07a", viewed: completion.ciel_good},
    {name: "13a", character: "cel", type: strings.endings.true, img: "cel_f02", viewed: completion.ciel_true},
    {name: "14b", character: "his", type: strings.endings.good, img: "his_f02", viewed: completion.hisui_good},
    {name: "14a", character: "his", type: strings.endings.true, img: "his_f03", viewed: completion.hisui_true},
    {name: "12a", character: "koha", type: strings.endings.true, img: "koha_f01", viewed: completion.kohaku_true},
  ]

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
          {endings.map((ending, index) => {
            if (ending.viewed) {
              return <EndingComponent ending={ending} key={index} />
            } else {
              return <div key={index} className="ending" />
            }
          })}
          </div>

          <div className="badendings-list">
            <h3>{strings.endings.osiete}</h3>

            {/* TODO: tooltip with the title of each bad end */}
            <div className="badending">
              <img src={chalkboard} alt="Bad Ending" />
            </div>
          </div>
        </main>

        <Link to={SCREEN.EXTRA} className="menu-btn back-button">{strings.back}</Link>
      </div>
    </motion.div>
  )
}

export default EndingsScreen

const EndingComponent = ({ending}: {ending: any}) => {
  return (
    <div className={`ending ${ending.character}`}>
      <img className="ending-img" src={`${imgPrefix}${ending.img}.webp`} alt={ending.name} />
      <div className="ending-name">{wbb(strings.scenario.routes[ending.character as keyof typeof strings.characters][ending.name])}</div>
      <div className="ending-bottom">
        <div>{strings.characters[ending.character as keyof typeof strings.characters]}</div>
        <div className="ending-type">{ending.type}</div>
      </div>
    </div>
  )
}