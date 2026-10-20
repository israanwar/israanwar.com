import {renderToString} from "react-dom/server.browser";
import {Application} from "./Application";
import {getPublicDataSnapshot} from "./hooks/usePageData";
export function renderPublicSnapshot() {
 const html=renderToString(<Application initialLanguage="en" />);
 if(html.includes('<!--$!-->'))throw new Error("Public route was not ready for server rendering");
 return {html,bootstrap:{version:1,path:location.pathname,lang:"en",builtAt:Date.now(),alternates:{id:renderToString(<Application initialLanguage="id" />)},data:getPublicDataSnapshot()}};
}

window.__ISRA_PRERENDER__ = renderPublicSnapshot;
