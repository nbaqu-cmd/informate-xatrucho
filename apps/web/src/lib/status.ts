export interface StatusStyle {
  label: string;
  color: string;
  bg: string;
  pulse: boolean;
}

export const STATUS_STYLES: Record<string, StatusStyle> = {
  PENDING: { label: "Detectada", color: "#0073CF", bg: "rgba(0,115,207,.10)", pulse: false },
  SUMMARIZING: { label: "Resumiendo", color: "#A66A00", bg: "rgba(166,106,0,.12)", pulse: true },
  ANALYZING: { label: "En análisis", color: "#A66A00", bg: "rgba(166,106,0,.12)", pulse: true },
  TRANSCRIBING: { label: "Transcribiendo", color: "#6B4E9E", bg: "rgba(107,78,158,.13)", pulse: true },
  VIDEO_GENERATING: { label: "Generando video", color: "#6B4E9E", bg: "rgba(107,78,158,.13)", pulse: true },
  PUBLISHING: { label: "Publicando", color: "#6B4E9E", bg: "rgba(107,78,158,.13)", pulse: true },
  COMPLETE: { label: "Publicado", color: "#1F7A4D", bg: "rgba(31,122,77,.12)", pulse: false },
  FAILED: { label: "Error", color: "#CE1126", bg: "rgba(206,17,38,.10)", pulse: true },
};

export function getStatusStyle(status: string): StatusStyle {
  return STATUS_STYLES[status] ?? STATUS_STYLES["PENDING"]!;
}
