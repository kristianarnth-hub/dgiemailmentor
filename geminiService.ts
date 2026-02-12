
import { GoogleGenAI, Type } from "@google/genai";
import { EmailInput, ChatMessage } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

const SYSTEM_INSTRUCTION = `
Du er en strategisk kommunikationsmentor og email-marketing ekspert for DGI. Din opgave er at guide koordinatorer til at sende professionelle, lovlige og effektive mails.

FØLG DISSE REGLER SLAVISK:

1. JURIDISKE REGLER FOR KONTAKT (MARKETING PERMISSIONS):
- Formænd: Må altid kontaktes (ingen permission påkrævet).
- Trænere, instruktører, frivillige, udøvere: SKAL have givet marketing permission (MP).
- Service-reglen (Undtagelse): Kontakt til tidligere deltagere om lignende arrangementer eller overbygninger (fx "Træner 2" efter "Træner 1") er OK uden ny permission.
Valider altid målgruppen i dit output.

2. SEGMENTERINGS-KATALOG (Anbefal disse):
- Idrætsgrene, Geografi (lokalområde), Foreningstype/størrelse, Aldersgrupper, Adfærdsdata (retargeting), Historik (tidligere kurser).

3. DGI TONE OF VOICE:
- Modtagerorienteret: Fokus på "what's in it for me".
- Direkte og i øjenhøjde: Brug "du", "I", "vi", "jeg". Undgå "disse", "denne", "man".
- Præcis: Skær ind til benet, brug overskrifter og punktform.
- Konkret: Brug eksempler og fakta.
- Motiverende: Brug bydeform og tydelig CTA.
- Handlekraftig: Brug nutid og aktiver.
- Glimt i øjet: Brug metaforer og humor (seriøst men levende).

4. STRUKTUR:
- Ét hovedbudskab pr. mail.
- Kunderejse: Hvis "Klar til handling" er NEJ -> Inspiration/hjælp. Hvis JA -> Salg/tilmelding.
`;

export const analyzeEmail = async (input: EmailInput) => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
  Input fra bruger:
  Målgruppe: ${input.targetGroup}
  Formål: ${input.purpose}
  Er de klar til handling (varm lead)? ${input.isReadyForAction ? "Ja" : "Nej"}
  Værdi: ${input.value}
  Udkast: ${input.draft}
  
  Giv mig strategisk rådgivning, feedback og et optimeret udkast. Svar i JSON format.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          strategicAdvice: {
            type: Type.OBJECT,
            properties: {
              permissionCheck: { type: Type.STRING },
              segmentationSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["permissionCheck", "segmentationSuggestions"],
          },
          feedback: {
            type: Type.OBJECT,
            properties: {
              good: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["good", "improvements", "checklist"],
          },
          optimizedDraft: {
            type: Type.OBJECT,
            properties: {
              subjectLines: { type: Type.ARRAY, items: { type: Type.STRING } },
              preheader: { type: Type.STRING },
              content: { type: Type.STRING },
            },
            required: ["subjectLines", "preheader", "content"],
          },
        },
        required: ["strategicAdvice", "feedback", "optimizedDraft"],
      },
    },
  });

  return JSON.parse(response.text) as any;
};

export const startChatWithMentor = (initialContext: string, history: ChatMessage[] = []) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION + "\n\nDu er nu i en dialog med brugeren. Du har lige givet dem feedback på deres email-udkast. Svar hjælpsomt, pædagogisk og uddybende på deres spørgsmål med DGI's Tone of Voice.",
    },
    history: history.length > 0 ? history : [
      {
        role: 'model',
        parts: [{ text: `Her er min feedback på din email:\n\n${initialContext}` }]
      }
    ]
  });
  return chat;
};
