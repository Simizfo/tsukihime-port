const SaveComponent = ({ element, handleAction }: any) => {
  return (
    <button className="save-container" onClick={handleAction}>
      <img src="./image/event/his_e02b.jpg" />
      
      <div className="deta">
        <div className="date">
          <b>2023/07/17</b> 19:48
        </div>
        <div className="line">
          {element.value}
        </div>
      </div>
    </button>
  )
}

export default SaveComponent