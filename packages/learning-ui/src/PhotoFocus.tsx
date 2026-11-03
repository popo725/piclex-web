import { useEffect, useRef, useState } from 'react';
import { focusLayout } from './focus.mjs';
export type Focus = { visible: boolean; box: number[] } | null;
export function PhotoFocus({ src, focus, alt }: { src: string; focus: Focus; alt: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [image, setImage] = useState({ width: 0, height: 0 });
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); setImage({ width: 0, height: 0 }); }, [src]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const layout = focusLayout(image, size, focus);
  return <div className="photo-focus" ref={host}>
    {broken ? <p className="image-error">这张图片暂时无法显示，仍可继续练习。</p> : <img src={src} alt={alt} onError={() => setBroken(true)} onLoad={e => setImage({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })} style={layout ? { left: layout.image.x, top: layout.image.y, width: layout.image.width, height: layout.image.height } : undefined} />}
    {!broken && layout?.box && <span className="focus-box" aria-hidden="true" style={{ left: layout.box.x, top: layout.box.y, width: layout.box.width, height: layout.box.height }} />}
  </div>;
}
