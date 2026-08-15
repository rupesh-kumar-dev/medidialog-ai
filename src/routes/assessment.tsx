import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Mic, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AiAvatar, BrandLoader } from "@/components/brand";
import { MedicalDisclaimer } from "@/components/disclaimer";
import { EmergencyAlert } from "@/components/emergency-alert";
import { RiskCard } from "@/components/risk";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { analyzeAssessment, getFollowUpQuestions, type AssessmentResult } from "@/lib/ai.functions";
import { useAuth } from "@/lib/auth";
import { ALL_SYMPTOMS, DEMO_SCENARIOS, SYMPTOM_CATEGORIES } from "@/lib/health-data";

type Search = { demo?: string | undefined };

export const Route = createFileRoute("/assessment")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    demo: typeof search["demo"] === "string" ? search["demo"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "AI Health Assessment | MediSage AI" },
      {
        name: "description",
        content:
          "Describe your symptoms, answer adaptive AI follow-up questions and receive an easy-to-understand health summary.",
      },
      { property: "og:title", content: "AI Health Assessment | MediSage AI" },
      {
        property: "og:description",
        content: "Organise your symptoms and understand your next step.",
      },
    ],
  }),
  component: AssessmentPage,
});

type Answer = { question: string; answer: string };
type Question = { id: string; question: string; options: string[] };
type Stage = "collect" | "questions" | "result";

const SEVERITY_LABELS = ["Very mild", "Mild", "Moderate", "Strong", "Severe"];

function AssessmentPage() {
  const { demo } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const askFollowUps = useServerFn(getFollowUpQuestions);
  const runAnalysis = useServerFn(analyzeAssessment);

  const [stage, setStage] = useState<Stage>("collect");
  const [description, setDescription] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [manualSymptom, setManualSymptom] = useState("");
  const [severity, setSeverity] = useState([2]);
  const [duration, setDuration] = useState("1-3 days");
  const [frequency, setFrequency] = useState("Comes and goes");
  const [onset, setOnset] = useState("Gradual");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [current, setCurrent] = useState(0);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);
  const appliedDemo = useRef<string | null>(null);

  useEffect(() => {
    if (!demo || appliedDemo.current === demo) return;
    const scenario = DEMO_SCENARIOS.find((s) => s.id === demo);
    if (!scenario) return;
    appliedDemo.current = demo;
    setDescription(scenario.text);
    setSymptoms(scenario.symptoms);
    toast.success(`Loaded sample scenario: ${scenario.title}`);
  }, [demo]);

  const suggestions = useMemo(() => {
    const q = manualSymptom.trim().toLowerCase();
    if (!q) return [];
    return ALL_SYMPTOMS.filter((s) => s.toLowerCase().includes(q) && !symptoms.includes(s)).slice(
      0,
      6,
    );
  }, [manualSymptom, symptoms]);

  const progress =
    stage === "collect"
      ? symptoms.length || description.trim() ? 25 : 5
      : stage === "questions"
        ? Math.min(90, 40 + (questions.length ? (current / questions.length) * 50 : 0))
        : 100;

  function toggleSymptom(s: string) {
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function addManual(value?: string) {
    const v = (value ?? manualSymptom).trim();
    if (!v) return;
    if (!symptoms.includes(v)) setSymptoms((p) => [...p, v]);
    setManualSymptom("");
  }

  function clearAll() {
    setDescription("");
    setSymptoms([]);
    setManualSymptom("");
    setAnswers([]);
    setQuestions([]);
    setResult(null);
    setStage("collect");
    toast.info("Assessment cleared.");
  }

  function startVoice() {
    const w = window as unknown as { webkitSpeechRecognition?: new () => never; SpeechRecognition?: new () => never };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }
    try {
      const recognition = new Ctor() as unknown as {
        lang: string;
        onresult: (e: { results: { 0: { 0: { transcript: string } } } }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
      };
      recognition.lang = "en-US";
      recognition.onresult = (e) => {
        setDescription((prev) => `${prev} ${e.results[0][0].transcript}`.trim());
      };
      recognition.onend = () => setListening(false);
      recognition.onerror = () => {
        setListening(false);
        toast.error("Voice input did not work. Please type instead.");
      };
      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
      toast.error("Voice input is unavailable right now.");
    }
  }

  async function beginQuestions() {
    if (!description.trim() && symptoms.length === 0) {
      toast.error("Please describe how you feel or select at least one symptom.");
      return;
    }
    setLoading(true);
    try {
      const res = await askFollowUps({ data: { description, symptoms, answers: [] } });
      if (!res.questions.length) {
        await finish([]);
        return;
      }
      setQuestions(res.questions);
      setCurrent(0);
      setDraft("");
      setStage("questions");
    } catch {
      toast.error("Sorry, MediSage AI is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(skip = false) {
    const question = questions[current];
    if (!question) return;
    const value = skip ? "Skipped" : draft.trim();
    if (!skip && !value) {
      toast.error("Please choose or type an answer, or skip this question.");
      return;
    }
    const nextAnswers = [
      ...answers.filter((a) => a.question !== question.question),
      { question: question.question, answer: value },
    ];
    setAnswers(nextAnswers);
    setDraft("");

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      return;
    }

    setLoading(true);
    try {
      if (nextAnswers.length < 5) {
        const more = await askFollowUps({ data: { description, symptoms, answers: nextAnswers } });
        if (more.questions.length) {
          setQuestions([...questions, ...more.questions]);
          setCurrent(current + 1);
          setLoading(false);
          return;
        }
      }
      await finish(nextAnswers);
    } catch {
      toast.error("Sorry, MediSage AI is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function finish(finalAnswers: Answer[]) {
    setLoading(true);
    try {
      const res = await runAnalysis({
        data: {
          description,
          symptoms,
          answers: finalAnswers,
          duration,
          severity: `${SEVERITY_LABELS[severity[0] ?? 2]} (${(severity[0] ?? 2) + 1}/5), ${frequency}, ${onset} onset`,
        },
      });
      setResult(res);
      setStage("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Sorry, MediSage AI is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function saveAssessment() {
    if (!result) return;
    if (!user) {
      toast.error("Please sign in to save your assessment.");
      void navigate({ to: "/auth" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("assessments")
      .insert({
        user_id: user.id,
        symptoms: result.symptoms,
        description,
        duration,
        severity: SEVERITY_LABELS[severity[0] ?? 2] ?? "Moderate",
        risk_level: result.risk_level,
        summary: result.symptom_summary,
        possible_conditions: result.possible_conditions,
        recommendations: result.recommendations,
        warning_signs: result.warning_signs,
        next_steps: result.next_steps,
        explanation: result.explanation,
        answers,
      })
      .select("id")
      .maybeSingle();
    setSaving(false);
    if (error || !data) {
      toast.error("We couldn't save this assessment. Please try again.");
      return;
    }
    toast.success("Assessment saved to your health history.");
    void navigate({ to: "/report/$reportId", params: { reportId: data.id } });
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">AI Health Assessment</h1>
        <p className="mt-1 text-muted-foreground">
          Share how you feel. MediSage AI will ask a few questions and organise the information for
          you.
        </p>
      </header>

      <div className="mb-8" aria-live="polite">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium">Assessment Progress</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {loading ? <BrandLoader label="MediSage AI is thinking…" /> : null}

      {!loading && stage === "collect" ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Describe how you feel</CardTitle>
              <CardDescription>
                Example: “I have had a headache and mild fever for two days and I feel tired.”
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="symptom-text" className="sr-only">
                Symptom description
              </Label>
              <Textarea
                id="symptom-text"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell MediSage AI what you are experiencing…"
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={startVoice} disabled={listening}>
                  <Mic className="mr-2 h-4 w-4" />
                  {listening ? "Listening…" : "Voice input"}
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  <Trash2 className="mr-2 h-4 w-4" /> Clear
                </Button>
              </div>

              <div>
                <Label htmlFor="symptom-add">Add a symptom</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    id="symptom-add"
                    value={manualSymptom}
                    onChange={(e) => setManualSymptom(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addManual();
                      }
                    }}
                    placeholder="Start typing, e.g. Headache"
                    autoComplete="off"
                  />
                  <Button onClick={() => addManual()} type="button">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add symptom</span>
                  </Button>
                </div>
                {suggestions.length ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => addManual(s)}
                          className="rounded-full border border-border bg-secondary px-3 py-1 text-xs hover:border-primary"
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {symptoms.length ? (
                <div className="flex flex-wrap gap-2" aria-label="Selected symptoms">
                  {symptoms.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1 py-1.5">
                      {s}
                      <button
                        type="button"
                        onClick={() => toggleSymptom(s)}
                        aria-label={`Remove ${s}`}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Or choose symptoms by category</CardTitle>
              <CardDescription>Select everything that applies.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={SYMPTOM_CATEGORIES[0]!.id}>
                <TabsList className="flex h-auto flex-wrap justify-start gap-1">
                  {SYMPTOM_CATEGORIES.map((c) => (
                    <TabsTrigger key={c.id} value={c.id} className="text-xs">
                      {c.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {SYMPTOM_CATEGORIES.map((c) => (
                  <TabsContent key={c.id} value={c.id} className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {c.symptoms.map((s) => {
                        const active = symptoms.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleSymptom(s)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card hover:border-primary"
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>This helps MediSage AI ask better questions.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="severity">
                  Severity: {SEVERITY_LABELS[severity[0] ?? 2]} ({(severity[0] ?? 2) + 1}/5)
                </Label>
                <Slider
                  id="severity"
                  className="mt-3"
                  min={0}
                  max={4}
                  step={1}
                  value={severity}
                  onValueChange={setSeverity}
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Less than a day", "1-3 days", "4-7 days", "1-4 weeks", "More than a month"].map(
                      (d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Frequency</Label>
                <RadioGroup value={frequency} onValueChange={setFrequency} className="mt-2">
                  {["Constant", "Comes and goes", "Only at certain times"].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <RadioGroupItem value={f} id={`freq-${f}`} />
                      <Label htmlFor={`freq-${f}`} className="font-normal">
                        {f}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Onset</Label>
                <RadioGroup value={onset} onValueChange={setOnset} className="mt-2">
                  {["Sudden", "Gradual", "After an activity"].map((o) => (
                    <div key={o} className="flex items-center gap-2">
                      <RadioGroupItem value={o} id={`onset-${o}`} />
                      <Label htmlFor={`onset-${o}`} className="font-normal">
                        {o}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => void beginQuestions()}>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="ghost" onClick={clearAll}>
              <RotateCcw className="mr-2 h-4 w-4" /> Start over
            </Button>
          </div>

          <MedicalDisclaimer />
        </div>
      ) : null}

      {!loading && stage === "questions" && questions[current] ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AiAvatar />
              <div>
                <CardTitle className="text-lg">{questions[current]?.question}</CardTitle>
                <CardDescription>
                  Question {current + 1} of {questions.length}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {questions[current]?.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setDraft(o)}
                  aria-pressed={draft === o}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    draft === o
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
            <Label htmlFor="answer">Your answer</Label>
            <Textarea
              id="answer"
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your answer…"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void submitAnswer()}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (current === 0) {
                    setStage("collect");
                    return;
                  }
                  const prev = questions[current - 1];
                  setCurrent(current - 1);
                  setDraft(answers.find((a) => a.question === prev?.question)?.answer ?? "");
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button variant="ghost" onClick={() => void submitAnswer(true)}>
                Skip
              </Button>
              <Button variant="ghost" onClick={() => void finish(answers)}>
                Finish now
              </Button>
            </div>
            {answers.length ? (
              <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
                <p className="mb-2 font-medium">Your answers so far (click to edit)</p>
                <ul className="space-y-1">
                  {answers.map((a, i) => (
                    <li key={a.question}>
                      <button
                        type="button"
                        className="text-left text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setCurrent(i);
                          setDraft(a.answer);
                        }}
                      >
                        {a.question} — <span className="font-medium">{a.answer}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {!loading && stage === "result" && result ? (
        <div className="space-y-6">
          {result.risk_level === "urgent" ? (
            <EmergencyAlert
              warningSigns={result.warning_signs}
              onReturn={() => setStage("collect")}
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>AI-Assisted Health Assessment</CardTitle>
              <CardDescription>Information support — not a diagnosis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-semibold">Symptoms reported</p>
                <div className="flex flex-wrap gap-2">
                  {result.symptoms.map((s) => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-semibold">Symptom summary</p>
                <p className="text-sm text-muted-foreground">{result.symptom_summary}</p>
              </div>
              <RiskCard level={result.risk_level} explanation={result.explanation} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Possible conditions</CardTitle>
              <CardDescription>
                Listed for understanding only, ordered by how consistent they appear.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {result.possible_conditions.map((c) => (
                <div key={c.name} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{c.name}</h3>
                    <Badge variant="outline">{c.relevance}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{c.why}</p>
                  {c.common_symptoms.length ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">Common symptoms:</span>{" "}
                      {c.common_symptoms.join(", ")}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm">{c.general_info}</p>
                  <p className="mt-2 text-sm font-medium text-primary">{c.next_step}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <ListCard title="Recommendations" items={result.recommendations} />
            <ListCard title="Warning signs" items={result.warning_signs} />
            <ListCard title="Next steps" items={result.next_steps} />
          </div>

          <MedicalDisclaimer />

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void saveAssessment()} disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save Assessment"}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              Print Report
            </Button>
            <Button variant="outline" onClick={clearAll}>
              Start New Assessment
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing specific was highlighted.</p>
        )}
      </CardContent>
    </Card>
  );
}
