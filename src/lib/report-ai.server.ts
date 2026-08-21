import { GATEWAY_URL, MEDISAGE_MODEL } from "./ai-gateway.server";

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

export async function callGateway(system: string, content: ContentBlock[]): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI service is not configured.");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: MEDISAGE_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429)
      throw new Error("MediSage AI is busy right now. Please try again in a moment.");
    if (res.status === 402)
      throw new Error("AI credits are exhausted for this workspace. Please add credits to continue.");
    if (res.status === 403)
      throw new Error("AI access is currently blocked for this workspace.");
    console.error("gateway error", res.status, text);
    throw new Error("We couldn't complete the analysis.");
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const out = json.choices?.[0]?.message?.content;
  if (!out) throw new Error("We couldn't complete the analysis.");
  return out;
}

export function parseJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("We couldn't complete the analysis.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export const IMAGE_INSTRUCTION = `The user uploaded a medical image for AI-assisted image review (not diagnosis).
First check image quality: readable, not too blurry, not too dark, not too small, and whether it plausibly is a medical image. If quality is insufficient or it is not a medical image, set readable=false and set unreadable_reason to "This image is not clear enough for reliable AI-assisted review."
Never claim a diagnosis, never confirm a fracture or an infection. Use cautious wording such as "the image may show features that require professional evaluation".
Return ONLY JSON with this shape:
{"readable":true,"unreadable_reason":"","document_type":"image","title":"short label","patient":{"name":"","age":"","gender":""},"lab_name":"","report_date":"","tests":[],"summary":"cautious plain-language summary","abnormal_findings":[],"interpretation":"","image_review":{"quality":"good|fair|poor","appears_to_be":"e.g. chest X-ray / unclear","observations":["cautious visible features only"],"caution":"AI-assisted image review is not a diagnosis. A qualified radiologist or healthcare professional should interpret medical images."},"questions_for_doctor":["..."],"next_step":"...","warning_signs":[]}`;

export const LAB_INSTRUCTION = `The user uploaded a laboratory / medical report. Extract every test you can actually read.
Only extract information printed on the document. Never invent patient details, values, units or ranges.
If a value cannot be read reliably put "Unable to reliably read this value." in that field and set status "unknown".
ALWAYS use the reference range printed on the report (reference_source "report"). Only when the report prints no range may you use a widely used general adult range and set reference_source "general". If neither, use "none".
Set category to the panel the test belongs to, e.g. CBC, Lipid Profile, Liver Function Test, Kidney Function Test, Thyroid Profile, Blood Glucose, Urine Analysis, Vitamin Tests, Electrolytes, Other.
If the document cannot be read reliably, set readable=false and unreadable_reason to "The report could not be read reliably. Please upload a clearer image or PDF."
Return ONLY JSON with this shape:
{"readable":true,"unreadable_reason":"","document_type":"lab","title":"e.g. Complete Blood Count","patient":{"name":"if printed else empty","age":"if printed","gender":"if printed"},"lab_name":"laboratory name if printed","report_date":"YYYY-MM-DD if printed else empty","tests":[{"name":"Hemoglobin","category":"CBC","result":"10.2","unit":"g/dL","reference_range":"13-17","reference_source":"report","status":"normal|borderline|high|low|unknown","explanation":"what this test measures and what this value may mean, cautious plain language","possible_reasons":["only for values outside or near the range"],"discuss_with_doctor":"what to raise with a doctor about this value, empty if normal","needs_attention":"routine|discuss at next visit|prompt review — cautious, empty if normal"}],"summary":"3-4 plain sentences","abnormal_findings":["..."],"interpretation":"plain-language interpretation, cautious","questions_for_doctor":["5 useful questions"],"next_step":"...","warning_signs":["only if genuinely relevant"]}`;
