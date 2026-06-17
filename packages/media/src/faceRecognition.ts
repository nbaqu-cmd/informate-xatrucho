import {
  RekognitionClient,
  SearchFacesByImageCommand,
  IndexFacesCommand,
  CreateCollectionCommand,
} from "@aws-sdk/client-rekognition";
import { readFileSync } from "fs";

const rekognition = new RekognitionClient({
  region: process.env["AWS_REGION"] ?? "us-east-1",
});

const COLLECTION_ID =
  process.env["AWS_REKOGNITION_COLLECTION_ID"] ?? "congressmen";

export interface FaceMatch {
  congressmanId: string;
  confidence: number;
  timestamp: number;
}

export async function initializeCollection(): Promise<void> {
  try {
    await rekognition.send(
      new CreateCollectionCommand({ CollectionId: COLLECTION_ID })
    );
  } catch {
    // Collection already exists — that's fine
  }
}

export async function indexCongressmanFace(
  congressmanId: string,
  imageBuffer: Buffer
): Promise<void> {
  await rekognition.send(
    new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBuffer },
      ExternalImageId: congressmanId,
      DetectionAttributes: ["ALL"],
      MaxFaces: 1,
      QualityFilter: "AUTO",
    })
  );
}

export async function searchFaceInImage(
  imageBuffer: Buffer,
  timestamp: number
): Promise<FaceMatch[]> {
  try {
    const response = await rekognition.send(
      new SearchFacesByImageCommand({
        CollectionId: COLLECTION_ID,
        Image: { Bytes: imageBuffer },
        MaxFaces: 5,
        FaceMatchThreshold: 80,
      })
    );

    return (response.FaceMatches ?? [])
      .filter((m) => m.Face?.ExternalImageId && m.Similarity)
      .map((m) => ({
        congressmanId: m.Face!.ExternalImageId!,
        confidence: m.Similarity!,
        timestamp,
      }));
  } catch {
    return [];
  }
}

export async function scanFramesForCongressmen(
  framePaths: string[],
  frameIntervalSeconds: number
): Promise<FaceMatch[]> {
  const allMatches: FaceMatch[] = [];

  for (let i = 0; i < framePaths.length; i++) {
    const framePath = framePaths[i];
    if (!framePath) continue;

    const imageBuffer = readFileSync(framePath);
    const timestamp = i * frameIntervalSeconds;
    const matches = await searchFaceInImage(imageBuffer, timestamp);
    allMatches.push(...matches);
  }

  // Deduplicate: keep highest confidence per congressman per 30s window
  const deduplicated = new Map<string, FaceMatch>();
  for (const match of allMatches) {
    const windowKey = `${match.congressmanId}-${Math.floor(match.timestamp / 30)}`;
    const existing = deduplicated.get(windowKey);
    if (!existing || match.confidence > existing.confidence) {
      deduplicated.set(windowKey, match);
    }
  }

  return Array.from(deduplicated.values());
}
