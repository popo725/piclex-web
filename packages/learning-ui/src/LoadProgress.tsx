export type DownloadProgress={received:number;total:number|null};
const bytes=(n:number)=>n>=1024*1024?`${(n/1024/1024).toFixed(1)} MB`:`${Math.ceil(n/1024)} KB`;
export default function LoadProgress({label,progress,finishing=false}:{label:string;progress?:DownloadProgress|null;finishing?:boolean}){
 const percent=progress?.total?Math.min(100,Math.floor(progress.received/progress.total*100)):null;
 return <div className="load-progress" role="status"><span>{label}</span><progress aria-label={label} max={100} value={finishing?100:percent??undefined}/><small>{finishing?'下载完成，正在显示…':percent!==null?`${percent}% · ${bytes(progress!.received)} / ${bytes(progress!.total!)}`:progress?.received?`已下载 ${bytes(progress.received)}`:'正在连接…'}</small></div>;
}
