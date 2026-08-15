import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const FollowUpInput = z.object({
  description: z.string().default(""),
  symptoms: z.array(z.string()).default([]),
  answers: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
});

const AnalyzeInput = FollowUpInput.extend({
  duration: z.string().default(""),
  severity: z.string().default(""),
});

export type FollowUpQuestion = {
  id: string;
  question: string;
  options: string[];
};

export type AssessmentResult = {
  symptoms: string[];
  symptom_summary: string;
  possible_conditions: {
    name: string;
    relevance: "More consistent" | "Moderately consistent" | "Less consistent";
    why: string;
    common_symptoms: string[];
    general_info: string;
    next_step: string;
  }[];
  risk_level: "low" | "moderate" | "urgent";
  explanation: string;
  recommendations: string[];
  warning_signs: string[];
  next_steps: string[];
};

const followUpSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).default([]),
      }),
    )
    .default([]),
});

const conditionSchema = z.object({
  name: z.string(),
  relevance: z.string(),
  why: z.string().default(""),
  common_symptoms: z.array(z.string()).default([]),
  general_info: z.string().default(""),
  next_step: z.string().default(""),
});

const analysisSchema = z.object({
  symptoms: z.array(z.string()).default([]),
  symptom_summary: z.string().default(""),
  possible_conditions: z.array(conditionSchema).default([]),
  risk_level: z.string().default("low"),
  explanation: z.string().default(""),
  recommendations: z.array(z.string()).default([]),
  warning_signs: z.array(z.string()).default([]),
  next_steps: z.array(z.string()).default([]),
});

async function callGateway(system: string, prompt: string) {
  const { createLovableAiGatewayProvider, MEDISAGE_MODEL } = await import("./ai-gateway.server");
  const { streamText } = await import("ai");
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI service is not configured.");
  const gateway = createLovableAiGatewayProvider(key);
  const result = streamText({
    model: gateway(MEDISAGE_MODEL),
    system,
    prompt,
  });
  return await result.text;
}

function parseJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Unexpected AI response");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normaliseRelevance(value: string): AssessmentResult["possible_conditions"][number]["relevance"] {
  const v = value.toLowerCase();
  if (v.startsWith("more")) return "More consistent";
  if (v.startsWith("less")) return "Less consistent";
  return "Moderately consistent";
}

export const getFollowUpQuestions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FollowUpInput.parse(input))
  .handler(async ({ data }): Promise<{ questions: FollowUpQuestion[] }> => {
    const { MEDISAGE_SYSTEM_PROMPT } = await import("./ai-gateway.server");
    const answered = data.answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n");
    const prompt = `A person is completing a health assessment.

Free-text description: ${data.description || "(none)"}
Selected symptoms: ${data.symptoms.join(", ") || "(none)"}
Answers so far:
${answered || "(none yet)"}

Generate the next 1 to 3 most useful clarifying questions (never repeat an already answered question).
Return ONLY JSON in this exact shape:
{"questions":[{"question":"...","options":["...","..."]}]}
Each question must be short, plain-language, and have 2-5 suggested answer options.
If enough information has already been gathered, return {"questions":[]}.`;

    const raw = await callGateway(MEDISAGE_SYSTEM_PROMPT, prompt);
    const parsed = followUpSchema.parse(parseJson(raw));
    return {
      questions: parsed.questions.slice(0, 3).map((q, i) => ({
        id: `q_${Date.now()}_${i}`,
        question: q.question,
        options: q.options.slice(0, 5),
      })),
    };
  });

export const analyzeAssessment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data }): Promise<AssessmentResult> => {
    const { MEDISAGE_SYSTEM_PROMPT } = await import("./ai-gateway.server");
    const answered = data.answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n");
    const prompt = `Produce an AI-assisted health assessment (NOT a diagnosis).

Description: ${data.description || "(none)"}
Selected symptoms: ${data.symptoms.join(", ") || "(none)"}
Duration: ${data.duration || "(unspecified)"}
Severity: ${data.severity || "(unspecified)"}
Follow-up answers:
${answered || "(none)"}

Return ONLY JSON with this exact shape:
{
 "symptoms": ["..."],
 "symptom_summary": "2-3 plain sentences",
 "possible_conditions": [
   {"name":"...","relevance":"More consistent|Moderately consistent|Less consistent","why":"...","common_symptoms":["..."],"general_info":"...","next_step":"..."}
 ],
 "risk_level": "low|moderate|urgent",
 "explanation": "why this risk level was chosen, in plain language, no internal reasoning steps",
 "recommendations": ["..."],
 "warning_signs": ["..."],
 "next_steps": ["..."]
}
Include 3-5 possible conditions when reasonable. Use hedged wording. Choose "urgent" only when reported symptoms could plausibly need prompt professional evaluation (for example chest discomfort with shortness of breath, severe breathing difficulty, signs of stroke, heavy bleeding, or fainting).`;

    const raw = await callGateway(MEDISAGE_SYSTEM_PROMPT, prompt);
    const parsed = analysisSchema.parse(parseJson(raw));
    const risk = parsed.risk_level.toLowerCase();
    return {
      symptoms: parsed.symptoms.length ? parsed.symptoms : data.symptoms,
      symptom_summary: parsed.symptom_summary,
      possible_conditions: parsed.possible_conditions.slice(0, 5).map((c) => ({
        ...c,
        relevance: normaliseRelevance(c.relevance),
      })),
      risk_level: risk === "urgent" ? "urgent" : risk === "moderate" ? "moderate" : "low",
      explanation: parsed.explanation,
      recommendations: parsed.recommendations,
      warning_signs: parsed.warning_signs,
      next_steps: parsed.next_steps,
    };
  });
