import LineComponent from "../components/LineComponent";

type Props = {
  pages: Page[],
  text: Line[],
}

import { useEffect, useRef, useState } from 'react';
import { Line, Page } from "../types";

const HistoryLayer = ({ pages, text }: Props) => {
  const [displayHistory, setDisplayHistory] = useState(false)
  const historyRef = useRef<HTMLDivElement>(null);;

  //if right click and history is displayed, hide history
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (displayHistory) {
        setDisplayHistory(false)
      }
    }
    window.addEventListener('contextmenu', handleContextMenu)
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu)
    }
  })

  //on mouse wheel up display history
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0 && !displayHistory && pages.length !== 0) {
        setDisplayHistory(true)
      }
    }
    window.addEventListener('wheel', handleWheel)
    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  })

  //on scroll bottom in history, hide history
  useEffect(() => {
    const handleScroll = (e: any) => {
      const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight
      if (bottom) {
        setDisplayHistory(false)
      }
    }
    const history = document.getElementById('history')
    history?.addEventListener('scroll', handleScroll)
    return () => {
      history?.removeEventListener('scroll', handleScroll)
    }
  })

  useEffect(() => {
    const historyElement = historyRef.current;
    historyElement!.scrollTop = historyElement!.scrollHeight - historyElement!.clientHeight - 1;
  }, [pages, text]);

  return (
    <div className={`box-text ${displayHistory ? "show" : ""}`} id="history" ref={historyRef}>
      <div className="text-container">
        {/* lignes des pages précédentes */}
        {pages.map((page, i) =>
          page.map((line: any, j: any) =>
            <LineComponent key={i + "_" + j} line={line} />
          )
        )}

        {/* lignes de la page actuelle */}
        {text.map((line, i) =>
          <LineComponent key={i} line={line} />
        )}
      </div>
    </div>
  );
};


export default HistoryLayer