import {createSunEngine} from "./sunEngine.js";
class Surface extends EventTarget {
 bounds={left:0,top:0,width:1,height:1};
 get clientWidth(){return this.bounds.width;}get clientHeight(){return this.bounds.height;}
 getBoundingClientRect(){return this.bounds;}
}
const surface=new Surface(), view=new EventTarget(), visibility=new EventTarget();
visibility.hidden=false;let engine, resizeCallback;
const ResizeObserver=class {constructor(callback){resizeCallback=callback;}observe(){}disconnect(){resizeCallback=null;}};
let firstFrame=true;
self.onmessage=async ({data})=>{
 try {
  if(data.type==="init") {
   view.devicePixelRatio=data.pixelRatio;view.innerHeight=data.height;
   engine=await createSunEngine({...data,surface,environment:{window:view,document:visibility,ResizeObserver,requestAnimationFrame:self.requestAnimationFrame ? self.requestAnimationFrame.bind(self) : callback=>setTimeout(()=>callback(performance.now()),16),cancelAnimationFrame:self.cancelAnimationFrame ? self.cancelAnimationFrame.bind(self) : clearTimeout,frame(){if(firstFrame){firstFrame=false;self.postMessage({type:"frame"});}}}});
   self.postMessage({type:"ready"});
  }else if(data.type==="resize"){surface.bounds=data.bounds;view.innerHeight=data.height;resizeCallback?.();}
  else if(data.type==="start")engine.start();
  else if(data.type==="stop")engine.stop();
  else if(data.type==="visibility"){visibility.hidden=data.hidden;visibility.dispatchEvent(new Event("visibilitychange"));}
  else if(data.type==="scroll")view.dispatchEvent(new Event("scroll"));
  else if(data.type==="event") {const event=new Event(data.eventType);Object.assign(event,data.event);(data.target==="surface"?surface:view).dispatchEvent(event);}
 }catch(error){self.postMessage({type:"error",message:error.message});}
};
