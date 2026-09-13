import { useId, useState } from "react";

/** A self-contained isometric illustration: no remote assets or WebGL required. */
export function JourneyScene({ compact = false }: { compact?: boolean }) {
  const id = useId().replace(/:/g, "");
  const [paused, setPaused] = useState(false);
  return (
    <div className={`journey-scene ${compact ? "journey-scene--compact" : ""} ${paused ? "is-paused" : ""}`}>
      <div className="scene-orbit scene-orbit--one" /><div className="scene-orbit scene-orbit--two" />
      <svg className="journey-art" viewBox="0 0 680 580" role="img" aria-label="A green car on a winding elevated road, connecting two places through a miniature landscape">
        <defs>
          <linearGradient id={`${id}-land`} x2="0.8" y2="1"><stop stopColor="#e0edc9"/><stop offset="1" stopColor="#92b780"/></linearGradient>
          <linearGradient id={`${id}-side`} x2="0" y2="1"><stop stopColor="#759b64"/><stop offset="1" stopColor="#345b48"/></linearGradient>
          <linearGradient id={`${id}-car`} x2="0.3" y2="1"><stop stopColor="#d6ff81"/><stop offset="1" stopColor="#71b344"/></linearGradient>
          <linearGradient id={`${id}-glass`} x2="1" y2="1"><stop stopColor="#7ca99a"/><stop offset="1" stopColor="#173e36"/></linearGradient>
          <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>
        </defs>
        <ellipse cx="353" cy="482" rx="239" ry="42" fill="#082c20" opacity=".24" filter={`url(#${id}-shadow)`}/>
        <g className="scene-island">
          <path d="M62 332 355 169 623 322 623 364Q623 380 607 390L361 531Q346 540 329 530L77 385Q62 376 62 361Z" fill={`url(#${id}-side)`}/>
          <path d="M77 316 332 170Q348 161 364 170L607 309Q640 329 607 348L361 490Q345 499 329 490L77 346Q48 330 77 316Z" fill={`url(#${id}-land)`}/>
          <path d="M84 336 336 479Q348 486 362 477L605 337" fill="none" stroke="#e5efce" strokeWidth="2" opacity=".5"/>
          <path d="M131 360 260 287Q298 266 334 288L418 336Q455 357 491 335L550 301" fill="none" stroke="#78916d" strokeWidth="72"/>
          <path d="M131 352 260 279Q298 258 334 280L418 328Q455 349 491 327L550 293" fill="none" stroke="#eaf0dc" strokeWidth="65"/>
          <path d="M131 352 260 279Q298 258 334 280L418 328Q455 349 491 327L550 293" fill="none" stroke="#344c44" strokeWidth="52"/>
          <path d="M131 352 260 279Q298 258 334 280L418 328Q455 349 491 327L550 293" fill="none" stroke="#e7e9c5" strokeWidth="2" strokeDasharray="11 12"/>
          <g fill="#5c8857" opacity=".4"><ellipse cx="210" cy="376" rx="35" ry="15"/><ellipse cx="419" cy="246" rx="39" ry="18"/><ellipse cx="477" cy="398" rx="36" ry="15"/></g>
          {[[205, 354, 1], [423, 218, 1.15], [479, 382, .8], [537, 257, .6], [274, 423, .65]].map(([x,y,s], i) => <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <path d="M0 0V-52" stroke="#635b3b" strokeWidth="7"/><path d="M0-106-28-47Q0-31 29-47Z" fill="#33694e"/><path d="M0-106V-40Q19-42 29-47Z" fill="#24523e"/><path d="M0-119-23-70Q0-56 24-70Z" fill="#4d8257"/>
          </g>)}
          <g transform="translate(323 207)"><path d="M0 0 38-22 74-1 37 21Z" fill="#f5f0d6"/><path d="M0 0V-43L37-22V21Z" fill="#e0dbc0"/><path d="M37 21V-22L74-43V-1Z" fill="#b5bd9e"/><path d="M-7-43 32-76 81-45 37-20Z" fill="#426c56"/><path d="M13-29 25-22V-7L13-14Z" fill="#53786b"/><path d="M48-16 62-24V-8L48 0Z" fill="#42675a"/></g>
          <g className="scene-car" transform="translate(350 301)">
            <ellipse cx="0" cy="15" rx="67" ry="22" fill="#132d24" opacity=".35"/>
            <path d="M-62-16-25-40 59 8 60 26 23 48-62-1Z" fill="#54853a"/>
            <g fill="#172d28" stroke="#355146" strokeWidth="5"><ellipse cx="-37" cy="8" rx="11" ry="15" transform="rotate(-25 -37 8)"/><ellipse cx="34" cy="34" rx="11" ry="15" transform="rotate(-25 34 34)"/></g>
            <path d="M-65-24-25-47 64 3 24 27Z" fill={`url(#${id}-car)`}/>
            <path d="M-65-24 24 27 24 42-65-9Z" fill="#8bc44b"/><path d="M24 27 64 3 64 18 24 42Z" fill="#6b9f3c"/>
            <path d="M-39-36-21-66 13-46 30-5Z" fill="#518844"/>
            <path d="M-21-66 9-83 43-64 13-46Z" fill="#c7ee88"/>
            <path d="M13-46 43-64 59-22 30-5Z" fill={`url(#${id}-glass)`}/>
            <path d="M-33-36-20-59-5-50 1-17Z" fill={`url(#${id}-glass)`}/><path d="M0-47 10-41 23-6 7-15Z" fill="#244e41"/>
            <path d="M30 27 42 20M52 14 59 10" stroke="#f4ffd3" strokeWidth="5"/><path d="M-57-10-47-4" stroke="#e5a46d" strokeWidth="4"/>
            <path d="M0-4 9 1" stroke="#3a6833" strokeWidth="2"/>
          </g>
          <g className="scene-pin" transform="translate(155 266)"><ellipse cy="57" rx="19" ry="9" fill="#416c4c" opacity=".3"/><path d="M0 45C-6 32-26 14-26-4a26 26 0 0 1 52 0C26 14 6 32 0 45Z" fill="#e4f9a5"/><circle cy="-4" r="10" fill="#2b6043"/></g>
          <g transform="translate(558 219)"><ellipse cy="53" rx="15" ry="7" fill="#416c4c" opacity=".3"/><path d="M0 45V-20" stroke="#f5efd6" strokeWidth="4"/><path d="M2-20 31-4 2 11Z" fill="#e9ac65"/></g>
        </g>
      </svg>
      <div className="scene-note scene-note--top"><span className="scene-note-icon">↗</span><div><strong>Same direction.</strong><span>Better together.</span></div></div>
      <div className="scene-note scene-note--bottom"><span className="scene-note-icon">✓</span><div><strong>A little less fuel.</strong><span>A lot more possibility.</span></div></div>
      {!compact && <button className="scene-motion" type="button" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? "Play motion" : "Pause motion"}<span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span></button>}
    </div>
  );
}
