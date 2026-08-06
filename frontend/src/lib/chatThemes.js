export const CHAT_THEMES = [
  {
    id: "default",
    label: "Default",
    icon: "💬",
    sender: "bg-cyan-600 text-white",
    receiver: "bg-slate-800 text-slate-200",
    background: "bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent",
    floats: [],
  },
  {
    id: "love",
    label: "Love",
    icon: "💖",
    sender: "bg-rose-600 text-white",
    receiver: "bg-rose-950/60 text-rose-100",
    background: "bg-gradient-to-br from-rose-600/25 via-rose-500/10 to-transparent",
    floats: ["💖", "💕", "💘", "❤️"],
  },
  {
    id: "halloween",
    label: "Halloween",
    icon: "🎃",
    sender: "bg-orange-600 text-white",
    receiver: "bg-purple-950/70 text-purple-100",
    background: "bg-gradient-to-br from-orange-600/20 via-purple-900/30 to-transparent",
    floats: ["🎃", "👻", "🦇", "🕸️"],
  },
  {
    id: "christmas",
    label: "Christmas",
    icon: "🎄",
    sender: "bg-red-600 text-white",
    receiver: "bg-emerald-900/70 text-emerald-100",
    background: "bg-gradient-to-br from-emerald-600/20 via-red-600/15 to-transparent",
    floats: ["🎄", "🎅", "❄️", "⛄"],
  },
  {
    id: "ocean",
    label: "Ocean",
    icon: "🌊",
    sender: "bg-sky-600 text-white",
    receiver: "bg-sky-950/70 text-sky-100",
    background: "bg-gradient-to-br from-sky-600/20 via-blue-700/20 to-transparent",
    floats: ["🌊", "🐬", "🐚", "🫧"],
  },
  {
    id: "night",
    label: "Night",
    icon: "🌙",
    sender: "bg-indigo-600 text-white",
    receiver: "bg-slate-900/70 text-slate-200",
    background: "bg-gradient-to-br from-indigo-700/25 via-purple-900/20 to-transparent",
    floats: ["🌙", "✨", "⭐", "🌠"],
  },
];

export const DEFAULT_THEME_ID = "default";

export const getTheme = (themeId) =>
  CHAT_THEMES.find((theme) => theme.id === themeId) || CHAT_THEMES[0];
