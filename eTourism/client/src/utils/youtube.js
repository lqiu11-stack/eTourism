export const YOUTUBE_URL_RE = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})([&?].*)?$/i;

export const isYouTubeUrl = (url) => YOUTUBE_URL_RE.test((url || "").trim());

export const toYouTubeEmbed = (url) => {
  const match = (url || "").trim().match(YOUTUBE_URL_RE);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[5]}`;
};
