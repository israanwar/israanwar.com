// Public build data only: no session, cart, credentials, or private records.
export const publicBootstrap = (() => {
 if(typeof document === "undefined")return null;
 const element=document.getElementById("public-bootstrap");
 if(!element)return null;
 try {const value=JSON.parse(element.textContent);return value.version===1 && value.path===location.pathname ? value : null;}catch{return null;}
})();
