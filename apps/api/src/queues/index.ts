import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const QUEUE_NAMES = {
  GAZETTE_MONITOR: "gazette-monitor",
  CONGRESS_MONITOR: "congress-monitor",
  LAW_PIPELINE: "law-pipeline",
  SUMMARIZE: "summarize",
  DEEP_ANALYZE: "deep-analyze",
  IMPACT_ANALYZE: "impact-analyze",
  CONSTITUTIONAL_REVIEW: "constitutional-review",
  TRANSCRIBE: "transcribe",
  FACE_RECOGNIZE: "face-recognize",
  GENERATE_VIDEO: "generate-video",
  PUBLISH: "publish",
  COMPILE_REPORT: "compile-report",
  PATTERN_DETECT: "pattern-detect",
} as const;

function makeQueue(name: string): Queue {
  return new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { age: 86400, count: 100 },
      removeOnFail: { age: 604800 },
    },
  });
}

export const queues = {
  gazetteMonitor: makeQueue(QUEUE_NAMES.GAZETTE_MONITOR),
  congressMonitor: makeQueue(QUEUE_NAMES.CONGRESS_MONITOR),
  lawPipeline: makeQueue(QUEUE_NAMES.LAW_PIPELINE),
  summarize: makeQueue(QUEUE_NAMES.SUMMARIZE),
  deepAnalyze: makeQueue(QUEUE_NAMES.DEEP_ANALYZE),
  impactAnalyze: makeQueue(QUEUE_NAMES.IMPACT_ANALYZE),
  constitutionalReview: makeQueue(QUEUE_NAMES.CONSTITUTIONAL_REVIEW),
  transcribe: makeQueue(QUEUE_NAMES.TRANSCRIBE),
  faceRecognize: makeQueue(QUEUE_NAMES.FACE_RECOGNIZE),
  generateVideo: makeQueue(QUEUE_NAMES.GENERATE_VIDEO),
  publish: makeQueue(QUEUE_NAMES.PUBLISH),
  compileReport: makeQueue(QUEUE_NAMES.COMPILE_REPORT),
  patternDetect: makeQueue(QUEUE_NAMES.PATTERN_DETECT),
};

export { connection };

export function allQueues(): Queue[] {
  return Object.values(queues);
}
