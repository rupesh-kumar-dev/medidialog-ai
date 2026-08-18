CREATE TABLE public.medical_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Medical report',
  kind TEXT NOT NULL DEFAULT 'lab',
  file_path TEXT,
  file_type TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  report_date DATE,
  lab_name TEXT,
  summary TEXT,
  analysis JSONB,
  abnormal_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_reports TO authenticated;
GRANT ALL ON public.medical_reports TO service_role;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own medical reports" ON public.medical_reports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX medical_reports_user_created_idx ON public.medical_reports (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_medical_reports_updated_at BEFORE UPDATE ON public.medical_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users read own medical files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own medical files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own medical files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);