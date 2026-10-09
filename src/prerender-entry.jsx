import {renderToString} from "react-dom/server.browser";
import {Application} from "./Application";
import {getPublicDataSnapshot} from "./hooks/usePageData";
export function renderPublicSnapshot() {
 // The invoice workspace owns browser drafts and a print portal. Preserve its
 // browser snapshot and client lifecycle instead of hydrating a public default.
 if(location.pathname==="/tools/invoice-builder")return {html:null,bootstrap:null};
 const html=renderToString(<Application initialLanguage="en" />);
 if(html.includes('<!--$!-->'))throw new Error("Public route was not ready for server rendering");
 return {html,bootstrap:{version:1,path:location.pathname,lang:"en",alternates:{id:renderToString(<Application initialLanguage="id" />)},data:getPublicDataSnapshot()}};
}

window.__ISRA_PRERENDER__ = renderPublicSnapshot;
