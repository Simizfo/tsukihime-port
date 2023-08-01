type TabBtnProps = {
  text: string,
  active: boolean,
  onClick: ()=> void
}

const TabBtn = ({text, active, onClick}: TabBtnProps) => (
  <button className={`page-btn ${active ? 'active' : ''}`}
    onClick={onClick}>
    {text}
  </button>
)

export default TabBtn