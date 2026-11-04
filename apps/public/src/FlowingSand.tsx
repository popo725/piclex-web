import {useEffect,useRef,useState} from 'react';

const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}
`;
const fragmentSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D photograph;
uniform float time;
uniform vec2 cover;
varying vec2 uv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
 vec2 cell=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(cell),hash(cell+vec2(1.,0.)),f.x),mix(hash(cell+vec2(0.,1.)),hash(cell+vec2(1.,1.)),f.x),f.y);
}
void main(){
 // Spatially varying displacement bends the crest itself, rather than sliding a flat image.
 vec2 drift=vec2(
  .055*sin(uv.y*6.+time*.28)+.026*sin(uv.x*5.+uv.y*4.-time*.20),
  .045*cos(uv.x*5.-time*.24)+.024*sin((uv.x-uv.y)*7.+time*.17));
 vec2 sandUV=(uv-.5)*cover*.82+.5+drift;
 vec3 sand=texture2D(photograph,sandUV).rgb;
 // Continuous low-contrast wind and fine grains travel across the moving surface.
 // No bright particles, drawn wave lines, or frame-randomized glitter.
 float wind=noise(sandUV*vec2(8.,22.)+vec2(-time*.09,time*.04))-.5;
 float grain=noise(sandUV*vec2(350.,500.)+vec2(-time*3.,time*.6))-.5;
 sand*=1.+wind*.035;
 sand+=grain*.012;
 gl_FragColor=vec4(sand,1.);
}
`;

/** A small, 24 fps surface renderer. The photograph remains the no-GPU/static fallback. */
export default function FlowingSand({src,active}:{src:string;active:boolean}){
 const surface=useRef<HTMLSpanElement>(null),elapsed=useRef(0);
 const [visible,setVisible]=useState(()=>!document.hidden);
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const visibility=()=>setVisible(!document.hidden),motion=()=>setReduced(media.matches);
  const hide=()=>setVisible(false);
  document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',hide);window.addEventListener('pageshow',visibility);media.addEventListener('change',motion);
  return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',visibility);media.removeEventListener('change',motion);};
 },[]);
 useEffect(()=>{
  const host=surface.current;
  if(!host||!active||!visible||reduced)return;
  // A fresh canvas on resume avoids retaining a lost context after a browser/GPU reset.
  const canvas=document.createElement('canvas');canvas.className='camera-sand-flow';canvas.setAttribute('aria-hidden','true');
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
  if(!gl)return;
  let frame=0,stopped=false,cleaned=false,ready=false,last=0;
  let program:WebGLProgram|null=null,buffer:WebGLBuffer|null=null,texture:WebGLTexture|null=null;
  const shaders:WebGLShader[]=[];
  const picture=new Image();
  const stop=()=>{stopped=true;cancelAnimationFrame(frame);canvas.remove();};
  const lost=()=>stop();
  canvas.addEventListener('webglcontextlost',lost);
  let draw=()=>{};
  const resize=()=>{
   const box=host.getBoundingClientRect(),scale=Math.min(devicePixelRatio||1,1.5,768/Math.max(box.width,box.height,1));
   canvas.width=Math.max(1,Math.round(box.width*scale));canvas.height=Math.max(1,Math.round(box.height*scale));
   gl.viewport(0,0,canvas.width,canvas.height);if(ready)draw();
  };
  const observer=new ResizeObserver(resize);
  const cleanup=()=>{
   if(cleaned)return;cleaned=true;
   stop();observer.disconnect();picture.onload=null;picture.onerror=null;canvas.removeEventListener('webglcontextlost',lost);
   if(texture)gl.deleteTexture(texture);if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);
   shaders.forEach(shader=>gl.deleteShader(shader));gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
  try{
   const compile=(type:number,source:string)=>{
    const shader=gl.createShader(type);if(!shader)throw Error('Shader unavailable');shaders.push(shader);
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Shader unsupported');return shader;
   };
   program=gl.createProgram();if(!program)throw Error('Renderer unavailable');
   gl.attachShader(program,compile(gl.VERTEX_SHADER,vertexSource));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentSource));
   gl.bindAttribLocation(program,0,'position');gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Renderer unsupported');gl.useProgram(program);
   buffer=gl.createBuffer();texture=gl.createTexture();if(!buffer||!texture)throw Error('Resources unavailable');
   gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
   gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   const clock=gl.getUniformLocation(program,'time'),cover=gl.getUniformLocation(program,'cover');
   gl.uniform1i(gl.getUniformLocation(program,'photograph'),0);
   draw=()=>{
    const aspect=canvas.width/canvas.height,imageAspect=picture.naturalWidth/picture.naturalHeight;
    gl.uniform2f(cover,Math.min(1,aspect/imageAspect),Math.min(1,imageAspect/aspect));
    gl.uniform1f(clock,elapsed.current);gl.drawArrays(gl.TRIANGLES,0,3);
   };
   const render=(now:number)=>{
    if(stopped)return;
    frame=requestAnimationFrame(render);
    if(!ready)return;
    if(last&&now-last<1000/24)return;
    if(last)elapsed.current+=(now-last)/1000;
    last=now;
    draw();
    // Reveal only after the first completed draw; an undecoded image never flashes black.
    if(!canvas.parentNode)host.appendChild(canvas);
   };
   picture.onload=()=>{
    if(stopped)return;
    try{
     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,picture);
     resize();ready=true;observer.observe(host);frame=requestAnimationFrame(render);
    }catch{cleanup();}
   };
   picture.onerror=cleanup;picture.src=src;
  }catch{cleanup();}
  return cleanup;
 },[src,active,visible,reduced]);
 return <span ref={surface} className="camera-sand-surface"><img className="camera-gold-sand" src={src} alt="" draggable={false}/></span>;
}
