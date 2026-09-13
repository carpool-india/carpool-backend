import { Link, Outlet } from "react-router-dom";
import { Logo } from "../components/Logo";
import { JourneyScene } from "../components/JourneyScene";

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <Logo to="/" variant="dark" />
        <div className="auth-story-copy"><p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p><h2>New places.<br />Familiar direction.<br /><em>Better company.</em></h2></div>
        <JourneyScene compact />
        <p className="auth-story-foot">A little less solo. A little more together.</p>
      </aside>
      <main className="auth-main"><Link to="/" className="auth-back">← Back to home</Link><Outlet /><p className="auth-foot">Your number connects you to your journeys.</p></main>
    </div>
  );
}
