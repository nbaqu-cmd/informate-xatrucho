import { anthropic, SONNET } from "./client.js";

export interface NarrationSection {
  /** Short on-screen heading for this segment (e.g. "¿Qué es esta ley?"). */
  heading: string;
  /** The spoken narration for this segment — natural, professional Honduran Spanish. */
  narration: string;
  /** One-line on-screen key takeaway shown alongside the narration. */
  onScreen: string;
  /** Visual emphasis: "neutral" for normal sections, "alert" for the constitutional warning. */
  tone: "neutral" | "alert";
}

export interface NarrationScript {
  /** Spoken intro line over the title card. */
  intro: string;
  sections: NarrationSection[];
  /** Spoken closing line over the outro card. */
  outro: string;
}

export interface NarrationInput {
  title: string;
  lawNumber: string;
  summary: string;
  causes: string;
  effects: string;
  benefits: string;
  drawbacks: string;
  poorImpact: string;
  middleImpact: string;
  wealthyImpact: string;
  isConstitutional: boolean;
  constitutionalFindings: string;
}

/**
 * Writes a professional spoken-news script that explains a law to ordinary
 * Honduran citizens: what it is, why it was passed, what it changes, who it
 * helps or hurts, and — critically — whether it may be unconstitutional and
 * exactly why. The constitutional verdict is always included; when the law is
 * flagged as non-compliant the script must state plainly that it may violate
 * the Constitution and explain which principles and why, because the whole
 * point is to let people see harm they might otherwise miss. No spin, no
 * editorializing beyond what the underlying analysis supports.
 */
export async function generateNarrationScript(input: NarrationInput): Promise<NarrationScript> {
  const constitutionalGuidance = input.isConstitutional
    ? `La revisión constitucional concluyó que la ley es COMPATIBLE con la Constitución. Confírmalo brevemente y con calma, citando el principio constitucional relevante. tone: "neutral".`
    : `La revisión constitucional concluyó que la ley PODRÍA SER INCONSTITUCIONAL. Esta es la sección más importante del video. Explica con claridad y seriedad: (1) que esta ley podría violar la Constitución de Honduras, (2) cuál o cuáles principios o artículos constitucionales están en juego, y (3) por qué representa un problema concreto para el pueblo hondureño. Habla directo, sin tecnicismos innecesarios, para que cualquier persona entienda el riesgo. tone: "alert".`;

  const message = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Eres el guionista de un noticiero hondureño de transparencia legislativa, "Infórmate Xatruch". Escribe el guión hablado de un video explicativo profesional sobre una ley, dirigido a ciudadanos comunes. El tono es serio, claro, confiable y sin sesgo político — solo los hechos y su análisis.

LEY: Decreto ${input.lawNumber} — ${input.title}

RESUMEN: ${input.summary}

POR QUÉ SE CREÓ (causas): ${input.causes}

QUÉ CAMBIA (efectos): ${input.effects}

BENEFICIOS: ${input.benefits}

RIESGOS: ${input.drawbacks}

IMPACTO CLASE BAJA: ${input.poorImpact}
IMPACTO CLASE MEDIA: ${input.middleImpact}
IMPACTO CLASE ALTA: ${input.wealthyImpact}

REVISIÓN CONSTITUCIONAL: ${input.constitutionalFindings}

INSTRUCCIÓN CONSTITUCIONAL CLAVE: ${constitutionalGuidance}

Escribe el guión en español hondureño natural, como se hablaría en voz alta (frases completas, fluidas, sin viñetas ni abreviaturas, sin emojis, sin leer URLs). Cada sección de narración debe durar entre 12 y 25 segundos al hablarse.

Responde ÚNICAMENTE con JSON válido en esta forma exacta:
{
  "intro": "Una o dos frases que presentan la ley y enganchan al espectador.",
  "sections": [
    { "heading": "¿Qué es esta ley?", "narration": "...", "onScreen": "frase corta clave", "tone": "neutral" },
    { "heading": "¿Por qué se creó?", "narration": "...", "onScreen": "...", "tone": "neutral" },
    { "heading": "¿Qué cambia?", "narration": "...", "onScreen": "...", "tone": "neutral" },
    { "heading": "¿A quién beneficia y a quién afecta?", "narration": "...", "onScreen": "...", "tone": "neutral" },
    { "heading": "Veredicto constitucional", "narration": "...", "onScreen": "...", "tone": "${input.isConstitutional ? "neutral" : "alert"}" }
  ],
  "outro": "Frase de cierre que invita a informarse, recordando que es transparencia sin sesgo."
}

Las cinco secciones son obligatorias y en ese orden. La narración debe basarse SOLO en la información proporcionada arriba; no inventes datos.`,
      },
    ],
  });

  const text = message.content[0];
  if (!text || text.type !== "text") throw new Error("No text response in generateNarrationScript");

  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in narration response");

  return JSON.parse(jsonMatch[0]) as NarrationScript;
}
