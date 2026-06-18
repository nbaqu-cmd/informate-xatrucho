import { anthropic, SONNET } from "./client.js";

export interface Source {
  title: string;
  url?: string;
  description: string;
}

export interface LawAnalysisResult {
  causes: string;
  effects: string;
  benefits: string;
  drawbacks: string;
  sources: Source[];
}

export async function analyzeLaw(
  fullText: string,
  lawTitle: string
): Promise<LawAnalysisResult> {
  const message = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 8192,
    thinking: {
      type: "enabled",
      budget_tokens: 5000,
    },
    messages: [
      {
        role: "user",
        content: `Eres un analista político y jurídico imparcial especializado en Honduras. Tu único objetivo es la verdad y la transparencia para el pueblo hondureño. No tienes lealtad a ningún partido político.

Realiza una investigación profunda y objetiva de la siguiente ley:

TÍTULO: ${lawTitle}

TEXTO COMPLETO:
${fullText}

Analiza desde múltiples ángulos: histórico, económico, social, político y jurídico.

REGLA DE ESTILO: no uses NUNCA el guión largo (—) ni guiones como signo de puntuación; usa comas, puntos, dos puntos o paréntesis.

Responde ÚNICAMENTE con JSON válido:
{
  "causes": "¿Por qué se creó esta ley? ¿Cuál era el problema que se buscaba resolver? ¿Qué presiones políticas, económicas o sociales la originaron? (mínimo 300 palabras)",
  "effects": "¿Qué cambios concretos produce esta ley? ¿Cómo modifica el statu quo? ¿Qué instituciones, sectores o ciudadanos se ven directamente afectados? (mínimo 300 palabras)",
  "benefits": "¿Qué aspectos positivos tiene esta ley? ¿A quiénes beneficia y cómo? Sé honesto aunque los beneficios sean limitados. (mínimo 200 palabras)",
  "drawbacks": "¿Qué problemas, riesgos o consecuencias negativas puede traer esta ley? ¿Qué derechos podrían verse afectados? ¿Hay potencial de abuso? (mínimo 200 palabras)",
  "sources": [
    {
      "title": "Nombre de la fuente o referencia",
      "url": "URL solo si estás SEGURO de que es una página real y estable; si tienes la menor duda, usa null. NUNCA inventes ni adivines una URL.",
      "description": "Por qué esta fuente es relevante"
    }
  ]
}

REGLA CRÍTICA sobre las fuentes: es un medio de transparencia; una fuente inventada destruye la credibilidad. Solo incluye una URL si estás seguro de que existe (ej. la página principal de un organismo conocido). Ante cualquier duda, pon "url": null. Prefiere citar leyes y organismos por su nombre sin URL antes que adivinar un enlace.`,
      },
    ],
  });

  // Find the text block (skip thinking blocks)
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from AI in analyzeLaw");
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in analyze response");

  return JSON.parse(jsonMatch[0]) as LawAnalysisResult;
}
