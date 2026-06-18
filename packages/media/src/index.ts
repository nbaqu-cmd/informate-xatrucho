export { downloadYouTubeVideo, searchYouTubeVideos } from "./downloader.js";
export type { DownloadResult } from "./downloader.js";

export { transcribeAudio, extractAudioFromVideo } from "./transcribe.js";
export type { TranscriptionResult } from "./transcribe.js";

export { extractClip, extractFrames } from "./clipExtractor.js";
export type { ClipResult } from "./clipExtractor.js";

export {
  initializeCollection,
  indexCongressmanFace,
  searchFaceInImage,
  scanFramesForCongressmen,
} from "./faceRecognition.js";
export type { FaceMatch } from "./faceRecognition.js";

export { uploadFile, uploadBuffer } from "./storage.js";

export { renderTikTokVideo, renderYouTubeVideo } from "./videoRenderer.js";

export { renderExplainerVideo } from "./explainerRenderer.js";
export type { ExplainerScriptInput, RenderedExplainer, ExplainerImage } from "./explainerRenderer.js";

export { synthesizeSpeech, activeTtsProvider } from "./tts.js";
export type { SynthesizedSpeech } from "./tts.js";

export { renderLawCover } from "./coverRenderer.js";
export type { LawCoverProps } from "./templates/LawCover.js";
