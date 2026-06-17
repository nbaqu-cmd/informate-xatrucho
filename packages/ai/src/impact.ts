import { anthropic, SONNET } from "./client.js";

export interface ImpactAnalysisResult {
  poorImpact: string;
  middleImpact: string;
  wealthyImpact: string;
}

export async function analyzeImpact(
  fullText: string,
  lawTitle: string,
  lawAnalysis: { causes: string; effects: string }
): Promise<ImpactAnalysisResult> {
  const message = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Eres un economista y analista social especializado en Honduras. Analiza el impacto concreto de esta ley en los diferentes estratos socioeconómicos del país.

TÍTULO: ${lawTitle}

TEXTO DE LA LEY:
${fullText}

ANÁLISIS PREVIO:
Causas: ${lawAnalysis.causes}
Efectos: ${lawAnalysis.effects}

Contexto hondureño a considerar:
- El 62% de la población vive en pobreza
- La clase media es pequeña y vulnerable
- La élite económica concentra la mayoría del capital
- La economía informal es muy grande
- Muchos hondureños dependen de remesas

Responde ÚNICAMENTE con JSON válido:
{
  "poorImpact": "Impacto en la población pobre (trabajadores informales, campesinos, personas sin acceso a servicios básicos). Usa ejemplos concretos y cotidianos. ¿Los afecta positiva o negativamente? ¿Por qué? (mínimo 250 palabras)",
  "middleImpact": "Impacto en la clase media (asalariados formales, pequeños empresarios, profesionales). Ejemplos concretos. (mínimo 250 palabras)",
  "wealthyImpact": "Impacto en la clase alta (grandes empresarios, élite política, inversionistas). ¿Quiénes se benefician económicamente de esta ley? (mínimo 250 palabras)"
}`,
      },
    ],
  });

  const text = message.content[0];
  if (!text || text.type !== "text") throw new Error("No text response in analyzeImpact");

  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in impact response");

  return JSON.parse(jsonMatch[0]) as ImpactAnalysisResult;
}
