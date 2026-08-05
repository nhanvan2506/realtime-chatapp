// How to make animated gradient border 👇
// https://cruip-tutorials.vercel.app/animated-gradient-border/
function BorderAnimatedContainer({ children }) {
    return (
        <div className="w-full h-full [background:linear-gradient(45deg,rgba(10,15,30,0.55),rgba(24,34,52,0.4)_50%,rgba(10,15,30,0.55))_padding-box,conic-gradient(from_var(--border-angle),rgba(148,163,184,0.2)_80%,_theme(colors.cyan.500/.7)_86%,_theme(colors.cyan.300/.8)_90%,_theme(colors.cyan.500/.7)_94%,_rgba(148,163,184,0.2))_border-box] rounded-3xl border border-transparent animate-border backdrop-blur-2xl flex overflow-hidden shadow-2xl shadow-cyan-500/5">
            {children}
        </div>
    );
}
export default BorderAnimatedContainer;