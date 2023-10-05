import strings from "../utils/lang"

type TabsProps = {
  tabs: any[],
  selected: string,
  setSelected: React.Dispatch<React.SetStateAction<any>>,
  textModifier?: (text: string) => string
}

const TabsComponent = ({ tabs, selected, setSelected, textModifier }: TabsProps) => (
  <div className="tabs">
    {tabs.map(value =>
      <TabBtn key={value}
        text={textModifier ? textModifier(value) : value}
        active={selected === value}
        onClick={() => setSelected(value)} />
    )}
  </div>
)

export default TabsComponent


type TabBtnProps = {
  text: string,
  active: boolean,
  onClick: ()=> void
}

const TabBtn = ({text, active, onClick}: TabBtnProps) => (
  <button className={`tab ${active ? 'active' : ''}`}
    onClick={onClick}>
      {strings.config.tab[text.toLowerCase() as keyof typeof strings.config.tab]}
  </button>
)