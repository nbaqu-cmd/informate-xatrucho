import { anthropic, SONNET } from "./client.js";

export interface ConstitutionalArticle {
  number: string;
  title: string;
  relevance: string;
  verdict: "COMPATIBLE" | "QUESTIONABLE" | "CONTRADICTORY";
}

export interface ConstitutionalReviewResult {
  isCompliant: boolean;
  articles: ConstitutionalArticle[];
  findings: string;
}

// Abbreviated key articles of the Honduran Constitution for reference
const CONSTITUTION_REFERENCE = `
Constitución de la República de Honduras (1982, con reformas):

Art. 1 - Honduras es un Estado de Derecho, soberano, constituido como república libre, democrática e independiente.
Art. 2 - La soberanía corresponde al pueblo del cual emanan los poderes del Estado.
Art. 4 - La forma de gobierno es republicana, democrática y representativa.
Art. 59 - La persona humana es el fin supremo de la sociedad y del Estado.
Art. 61 - La Constitución garantiza a los hondureños y extranjeros residentes el derecho a la inviolabilidad de la vida.
Art. 65 - El derecho a la vida es inviolable.
Art. 68 - Toda persona tiene derecho a que se respete su integridad física, psíquica y moral.
Art. 72 - Es libre la emisión del pensamiento por cualquier medio de difusión.
Art. 74 - No se puede restringir ni suspender el ejercicio de los derechos reconocidos en esta Constitución.
Art. 76 - Se garantiza el libre ejercicio de todas las religiones.
Art. 78 - Se garantizan las libertades de asociación y de reunión.
Art. 80 - Toda persona tiene el derecho de presentar peticiones a las autoridades.
Art. 82 - El derecho de defensa es inviolable.
Art. 86 - Nadie puede ser detenido ni incomunicado por más de veinticuatro horas.
Art. 99 - El domicilio es inviolable.
Art. 103 - Honduras reconoce, fomenta y garantiza la existencia de la propiedad privada.
Art. 107 - Los bienes inmuebles rústicos no pueden ser adquiridos por extranjeros en zonas fronterizas.
Art. 111 - El Estado reconoce la función social de la propiedad.
Art. 116 - El trabajo es un derecho y una obligación social.
Art. 127 - Todo trabajador tiene derecho a devengar un salario mínimo.
Art. 128 - Los trabajadores tienen derecho a formar sindicatos.
Art. 151 - La educación es función esencial del Estado.
Art. 175 - Ninguna ley podrá ser contraria a las disposiciones constitucionales.
Art. 185 - Los conflictos derivados de leyes inconstitucionales serán resueltos por la Corte Suprema.
Art. 205 - El Congreso Nacional tiene la potestad de decretar leyes.
Art. 245 - El Presidente de la República ejerce el Poder Ejecutivo.
Art. 303 - La justicia se imparte gratuitamente en nombre del Estado.
Art. 324 - Los servidores del Estado son depositarios de la autoridad y responsables de su conducta.
`;

export async function reviewConstitutionality(
  fullText: string,
  lawTitle: string
): Promise<ConstitutionalReviewResult> {
  const message = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Eres un constitucionalista experto en derecho hondureño. Analiza si la siguiente ley es compatible con la Constitución de Honduras.

TÍTULO DE LA LEY: ${lawTitle}

TEXTO DE LA LEY:
${fullText}

REFERENCIA CONSTITUCIONAL:
${CONSTITUTION_REFERENCE}

Responde ÚNICAMENTE con JSON válido:
{
  "isCompliant": true|false,
  "articles": [
    {
      "number": "Art. XX",
      "title": "Nombre del derecho o principio",
      "relevance": "Por qué este artículo es relevante para esta ley",
      "verdict": "COMPATIBLE" | "QUESTIONABLE" | "CONTRADICTORY"
    }
  ],
  "findings": "Análisis constitucional completo. Si hay contradicciones, explícalas con precisión jurídica. Si la ley es constitucional, confirma por qué. (mínimo 300 palabras)"
}

Identifica al menos 3 artículos constitucionales relevantes. Sé riguroso y objetivo.`,
      },
    ],
  });

  const text = message.content[0];
  if (!text || text.type !== "text") throw new Error("No text response in reviewConstitutionality");

  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in constitution response");

  return JSON.parse(jsonMatch[0]) as ConstitutionalReviewResult;
}
