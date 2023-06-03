import LineComponent from "../components/LineComponent";

type Props = {
  pages: Page[],
  text: Line[],
}

import { useEffect, useRef } from 'react';
import { Line, Page } from "../types";

const HistoryScreen = ({ pages, text }: Props) => {
  const historyRef = useRef<HTMLDivElement>(null);;

  useEffect(() => {
    const historyElement = historyRef.current;
    historyElement!.scrollTop = historyElement!.scrollHeight - historyElement!.clientHeight - 1;
  }, [pages, text]);

  return (
    <div className='box-text' id="history" ref={historyRef}>
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
  );
};


export default HistoryScreen;