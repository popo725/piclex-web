import{useId}from'react';
export type DownloadProgress={received:number;total:number|null};
const bytes=(n:number)=>n>=1024*1024?`${(n/1024/1024).toFixed(1)} MB`:`${Math.ceil(n/1024)} KB`;
// 拍立得外框里流动的沙画，仅在全页 .load-screen 中显示（紧凑进度条里 CSS 隐藏）。
function SandAlbum(){
 const uid=useId().replace(/[^a-zA-Z0-9_-]/g,''),frame=`sand-frame-${uid}`,sky=`sand-sky-${uid}`;
 return <svg className="load-sand-art" viewBox="0 0 88 110" aria-hidden="true" focusable="false">
  <defs>
   <clipPath id={frame}><rect x="8" y="8" width="72" height="72" rx="2"/></clipPath>
   <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#221b14"/><stop offset=".6" stopColor="#2f261b"/><stop offset="1" stopColor="#3e3325"/></linearGradient>
  </defs>
  <rect x=".75" y=".75" width="86.5" height="108.5" rx="4" fill="#fffdfa" stroke="#0000001a" strokeWidth=".7"/>
  <rect x="8" y="8" width="72" height="72" rx="2" fill={`url(#${sky})`}/>
  <g clipPath={`url(#${frame})`}>
   <g className="sand-dune sand-dune-1"><path d="M8 66C23 67 30 63 40 57C47 52 49 53 56 59C65 66 73 64 80 62L80 80L8 80Z" fill="#8a6c42"/></g>
   <g className="sand-stream sand-stream-1"><path d="M45 6C44 19 46 33 45.5 58" fill="none" stroke="#e8cba0" strokeWidth=".9" strokeDasharray=".7 2.4" strokeLinecap="round" opacity=".5"/><path d="M41.6 6C41 22 43 34 42.4 55" fill="none" stroke="#d8b284" strokeWidth=".65" strokeDasharray=".5 3.1" strokeLinecap="round" opacity=".38"/></g>
   <g className="sand-stream sand-stream-2"><path d="M49.5 6C50 18 48.5 30 49 52" fill="none" stroke="#dfbd91" strokeWidth=".8" strokeDasharray=".6 2.8" strokeLinecap="round" opacity=".42"/></g>
   <g className="sand-stream sand-stream-3"><path d="M46.5 6C45.5 21 47.5 33 47 56" fill="none" stroke="#e8cba0" strokeWidth=".6" strokeDasharray=".5 2.2" strokeLinecap="round" opacity=".3"/></g>
   <circle className="sand-grain sand-grain-1" cx="43.5" cy="18" r=".9" fill="#e6c79a"/>
   <circle className="sand-grain sand-grain-2" cx="47" cy="26" r=".7" fill="#e6c79a"/>
   <circle className="sand-grain sand-grain-3" cx="45" cy="34" r="1" fill="#efd6ae"/>
   <circle className="sand-grain sand-grain-4" cx="49.5" cy="12" r=".75" fill="#dfbd91"/>
   <g className="sand-dune sand-dune-2"><path d="M8 71C20 65 29 71 40 65C50 58 56 64 64 67C70 69 76 67 80 65L80 80L8 80Z" fill="#b08a58"/></g>
   <g className="sand-dune sand-dune-3"><path d="M8 75C17 71 25 76 34 74C43 71 51 76 60 74C69 72 75 75 80 73L80 80L8 80Z" fill="#d7b078"/></g>
  </g>
  <rect x="8" y="8" width="72" height="72" rx="2" fill="none" stroke="#0000001f"/>
 </svg>;
}
export default function LoadProgress({label,progress,finishing=false}:{label:string;progress?:DownloadProgress|null;finishing?:boolean}){
 const percent=progress?.total?Math.min(100,Math.floor(progress.received/progress.total*100)):null;
 return <div className="load-progress" role="status"><SandAlbum/><span>{label}</span><progress aria-label={label} max={100} value={finishing?100:percent??undefined}/><small>{finishing?'下载完成，正在显示…':percent!==null?`${percent}% · ${bytes(progress!.received)} / ${bytes(progress!.total!)}`:progress?.received?`已下载 ${bytes(progress.received)}`:'正在连接…'}</small></div>;
}
