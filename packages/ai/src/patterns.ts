import { anthropic, SONNET } from "./client.js";

export interface PatternAlertResult {
  detected: boolean;
  type: "PATTERN" | "ANOMALY" | "AGENDA";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  involvedParties: string[];
  relatedLawIds: string[];
}

export interface VotingRecord {
  lawId: string;
  lawTitle: string;
  partyName: string;
  forCount: number;
  againstCount: number;
  abstainCount: number;
}

export async function detectPatterns(
  recentVotingHistory: VotingRecord[],
  recentLawTitles: string[]
): Promise<PatternAlertResult | null> {
  if (recentVotingHistory.length < 3) return null;

  const message = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Eres un analista político especializado en detectar patrones legislativos en Honduras. Tu tarea es identificar si existe algún patrón, agenda o anomalía en las siguientes votaciones recientes.

HISTORIAL DE VOTACIONES RECIENTES:
${JSON.stringify(recentVotingHistory, null, 2)}

TÍTULOS DE LEYES RECIENTES:
${recentLawTitles.join("\n")}

Analiza si hay:
1. Un partido que consistentemente vota a favor/en contra de ciertos tipos de leyes
2. Leyes que sistemáticamente benefician a un grupo económico específico
3. Cambios legislativos que parecen coordinados para lograr un objetivo oculto
4. Anomalías estadísticas en los patrones de votación
5. Agendas legislativas de largo plazo que emergen de los datos

Si NO detectas ningún patrón significativo, responde con: { "detected": false }

Si SÍ detectas un patrón, responde con JSON válido:
{
  "detected": true,
  "type": "PATTERN" | "ANOMALY" | "AGENDA",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "description": "Descripción detallada del patrón detectado, con evidencia específica de los datos",
  "involvedParties": ["Partido 1", "Partido 2"],
  "relatedLawIds": ["id1", "id2"]
}`,
      },
    ],
  });

  const text = message.content[0];
  if (!text || text.type !== "text") return null;

  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  const result = JSON.parse(jsonMatch[0]) as { detected: boolean } & Partial<PatternAlertResult>;
  if (!result.detected) return null;

  return result as PatternAlertResult;
}
