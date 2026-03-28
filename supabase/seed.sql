-- Seed data for local development
-- Usage: supabase db reset (applies migrations + seed automatically)
-- Or: psql -f supabase/seed.sql (manual application)
--
-- Uses a fixed test user UUID. The seed assumes this user exists in auth.users.
-- When running `supabase db reset`, create the user first via the Supabase
-- Dashboard or by inserting into auth.users manually.

-- ============================================================
-- 0. Test user in auth.users (required for FK constraints)
-- ============================================================
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'dev@datapulse.at',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 1. Business Profile — DataPulse GmbH (Austrian SaaS)
-- ============================================================
INSERT INTO public.business_profiles (
  id, user_id, website_url, company_name, description, industry,
  product_summary, value_proposition, target_market
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'https://datapulse.at',
  'DataPulse GmbH',
  'DataPulse ist ein österreichisches SaaS-Unternehmen, das B2B-Unternehmen im DACH-Raum hilft, datengetriebene Entscheidungen schneller zu treffen. Unsere Plattform kombiniert Echtzeit-Datenanalyse mit KI-gestützten Prognosen für Vertrieb, Marketing und Operations.',
  'Software & Technology',
  'Cloud-basierte Analytics-Plattform für B2B-Unternehmen. Echtzeit-Dashboards, KI-Prognosen, automatisierte Reports. Integration mit gängigen CRM- und ERP-Systemen (SAP, Salesforce, HubSpot). DSGVO-konform, Hosting in der EU.',
  'Wir ermöglichen mittelständischen B2B-Unternehmen, ihre Vertriebspipeline um 40% effizienter zu gestalten — mit KI-gestützter Datenanalyse, die in 15 Minuten einsatzbereit ist, nicht in 6 Monaten.',
  'Mittelständische B2B-Unternehmen im DACH-Raum (50–1.000 Mitarbeiter) in den Branchen Software, Financial Services, Manufacturing und Professional Services. Entscheider in Vertrieb, Marketing und Geschäftsführung.'
) ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 2. ICP Profile — DACH B2B targeting
-- ============================================================
INSERT INTO public.icp_profiles (
  id, user_id, business_profile_id,
  job_titles, seniority_levels, industries, company_sizes,
  regions, tech_stack, revenue_ranges, funding_stages, keywords
) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  ARRAY['Geschäftsführer', 'Head of Sales', 'VP Sales', 'Vertriebsleiter', 'Chief Revenue Officer', 'Leiter Marketing', 'Head of Business Development', 'CDO', 'CTO', 'Head of Data'],
  ARRAY['C-Suite', 'VP', 'Director', 'Head of Department'],
  ARRAY['Software & Technology', 'Financial Services', 'Manufacturing'],
  ARRAY['51-200', '201-500', '501-1000'],
  ARRAY['Austria', 'Germany', 'Switzerland'],
  ARRAY['Salesforce', 'HubSpot', 'SAP', 'Microsoft Dynamics', 'Snowflake', 'Tableau', 'Power BI'],
  ARRAY['€10M-€50M', '€50M-€200M', '€200M-€500M'],
  ARRAY['Series A', 'Series B', 'Series C', 'Growth', 'Profitable'],
  ARRAY['Datenanalyse', 'Business Intelligence', 'Vertriebsoptimierung', 'CRM', 'Sales Automation', 'KI im Vertrieb', 'Revenue Operations', 'Predictive Analytics']
) ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 3. Search Campaign — completed
-- ============================================================
INSERT INTO public.search_campaigns (
  id, user_id, icp_profile_id, status,
  leads_found, leads_scored,
  started_at, completed_at
) VALUES (
  'd0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'completed',
  10,
  10,
  now() - interval '2 hours',
  now() - interval '1 hour 45 minutes'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Leads — 10 DACH companies
-- ============================================================

-- Lead 1: HOT — Alpentech GmbH, Wien
INSERT INTO public.leads (
  id, user_id, campaign_id,
  first_name, last_name, full_name, email, linkedin_url,
  job_title, seniority, company_name, company_domain, company_website,
  industry, company_size, revenue_range, funding_stage,
  location, country, source
) VALUES (
  'e0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Markus', 'Steiner', 'Markus Steiner', 'm.steiner@alpentech.at', 'https://linkedin.com/in/markussteiner',
  'Geschäftsführer', 'C-Suite',
  'Alpentech GmbH', 'alpentech.at', 'https://alpentech.at',
  'Software & Technology', '201-500', '€50M-€200M', 'Series B',
  'Wien', 'Austria', 'apollo'
) ON CONFLICT DO NOTHING;

-- Lead 2: HOT — Rheindata AG, Frankfurt
INSERT INTO public.leads (
  id, user_id, campaign_id,
  first_name, last_name, full_name, email, linkedin_url,
  job_title, seniority, company_name, company_domain, company_website,
  industry, company_size, revenue_range, funding_stage,
  location, country, source
) VALUES (
  'e0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Sabine', 'Hoffmann', 'Sabine Hoffmann', 's.hoffmann@rheindata.de', 'https://linkedin.com/in/sabinehoffmann',
  'Head of Sales', 'Director',
  'Rheindata AG', 'rheindata.de', 'https://rheindata.de',
  'Software & Technology', '501-1000', '€200M-€500M', 'Growth',
  'Frankfurt am Main', 'Germany', 'apollo'
) ON CONFLICT DO NOTHING;

-- Lead 3: QUALIFIED — Züritec SA, Zürich
INSERT INTO public.leads (
  id, user_id, campaign_id,
  first_name, last_name, full_name, email, linkedin_url,
  job_title, seniority, company_name, company_domain, company_website,
  industry, company_size, revenue_range, funding_stage,
  location, country, source
) VALUES (
  'e0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Lukas', 'Meier', 'Lukas Meier', 'l.meier@zuritec.ch', 'https://linkedin.com/in/lukasmeier',
  'VP Sales', 'VP',
  'Züritec SA', 'zuritec.ch', 'https://zuritec.ch',
  'Financial Services', '201-500', '€50M-€200M', 'Series C',
  'Zürich', 'Switzerland', 'apollo'
) ON CONFLICT DO NOTHING;

-- Lead 4: QUALIFIED — Bayernsoft GmbH, München
INSERT INTO public.leads (
  id, user_id, campaign_id,
  first_name, last_name, full_name, email, linkedin_url,
  job_title, seniority, company_name, company_domain, company_website,
  industry, company_size, revenue_range, funding_stage,
  location, country, source
) VALUES (
  'e0000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Christina', 'Weber', 'Christina Weber', 'c.weber@bayernsoft.de', 'https://linkedin.com/in/christinaweber',
  'Chief Revenue Officer', 'C-Suite',
  'Bayernsoft GmbH', 'bayernsoft.de', 'https://bayernsoft.de',
  'Software & Technology', '51-200', '€10M-€50M', 'Series A',
  'München', 'Germany', 'apollo'
) ON CONFLICT DO NOTHING;

-- Lead 5: ENGAGED — Donau Industrie AG, Wien
INSERT INTO public.leads (
  id, user_id, campaign_id,
  first_name, last_name, full_name, email, linkedin_url,
  job_title, seniority, company_name, company_domain, company_website,
  industry, company_size, revenue_range, funding_stage,
  location, country, source
) VALUES (
  'e0000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Thomas', 'Gruber', 'Thomas Gruber', 't.gruber@donauindustrie.at', 'https://linkedin.com/in/thomasgruber',
  'Vertriebsleiter', 'Director',
  'Donau Industrie AG', 'donauindustrie.at', 'https://donauindustrie.at',
  'Manufacturing', '501-1000', '€200M-€500M', 'Profitable',
  'Wien', 'Austria', 'apollo'
) ON CONFLICT DO NOTHING;

-- Lead 6: ENGAGED — HelvetiaFinanz AG, Bern
INSERT INTO public.leads (
  id, user_id, campaign_id,
  first_name, last_name, full_name, email, linkedin_url,
  job_title, seniority, company_name, company_domain, company_website,
  industry, company_size, revenue_range, funding_stage,
  location, country, source
) VALUES (
  'e0000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Anna', 'Brunner', 'Anna Brunner', 'a.brunner@helvetiafinanz.ch', 'https://linkedin.com/in/annabrunner',
  'Head of Business Development', 'Director',
  'HelvetiaFinanz AG', 'helvetiafinanz.ch', 'https://helvetiafinanz.ch',
  'Financial Services', '201-500', '€50M-€200M', 'Growth',
  'Bern', 'Switzerland', 'apollo'
) ON CONFLICT DO NOTHING;

-- Lead 7: ENGAGED — Berliner Maschinenbau GmbH, Berlin
INSERT INTO public.leads (
  id, user_id, campaign_id,
  first_name, last_name, full_name, email, linkedin_url,
  job_title, seniority, company_name, company_domain, company_website,
  industry, company_size, revenue_range, funding_stage,
  location, country, source
) VALUES (
  'e0000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Stefan', 'Richter', 'Stefan Richter', 's.richter@berliner-maschinenbau.de', 'https://linkedin.com/in/stefanrichter',
  'Leiter Marketing', 'Head of Department',
  'Berliner Maschinenbau GmbH', 'berliner-maschinenbau.de', 'https://berliner-maschinenbau.de',
  'Manufacturing', '501-1000', '€200M-€500M', 'Profitable',
  'Berlin', 'Germany', 'apollo'
) ON CONFLICT DO NOTHING;

-- Lead 8: POTENTIAL — Grazer Cloudworks GmbH, Graz
INSERT INTO public.leads (
  id, user_id, campaign_id,
  first_name, last_name, full_name, email, linkedin_url,
  job_title, seniority, company_name, company_domain, company_website,
  industry, company_size, revenue_range, funding_stage,
  location, country, source
) VALUES (
  'e0000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Eva', 'Pichler', 'Eva Pichler', 'e.pichler@grazer-cloudworks.at', 'https://linkedin.com/in/evapichler',
  'Head of Data', 'Head of Department',
  'Grazer Cloudworks GmbH', 'grazer-cloudworks.at', 'https://grazer-cloudworks.at',
  'Software & Technology', '51-200', '€10M-€50M', 'Series A',
  'Graz', 'Austria', 'apollo'
) ON CONFLICT DO NOTHING;

-- Lead 9: POTENTIAL — Norddeutsche Finanz GmbH, Hamburg
INSERT INTO public.leads (
  id, user_id, campaign_id,
  first_name, last_name, full_name, email, linkedin_url,
  job_title, seniority, company_name, company_domain, company_website,
  industry, company_size, revenue_range, funding_stage,
  location, country, source
) VALUES (
  'e0000000-0000-0000-0000-000000000009',
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Jörg', 'Schneider', 'Jörg Schneider', 'j.schneider@norddeutsche-finanz.de', 'https://linkedin.com/in/joergschneider',
  'CDO', 'C-Suite',
  'Norddeutsche Finanz GmbH', 'norddeutsche-finanz.de', 'https://norddeutsche-finanz.de',
  'Financial Services', '51-200', '€10M-€50M', 'Profitable',
  'Hamburg', 'Germany', 'apollo'
) ON CONFLICT DO NOTHING;

-- Lead 10: POOR — TirolerHandwerk eGen, Innsbruck
INSERT INTO public.leads (
  id, user_id, campaign_id,
  first_name, last_name, full_name, email, linkedin_url,
  job_title, seniority, company_name, company_domain, company_website,
  industry, company_size, revenue_range, funding_stage,
  location, country, source
) VALUES (
  'e0000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Franz', 'Huber', 'Franz Huber', 'f.huber@tirolerhandwerk.at', 'https://linkedin.com/in/franzhuber',
  'Betriebsleiter', 'Manager',
  'TirolerHandwerk eGen', 'tirolerhandwerk.at', 'https://tirolerhandwerk.at',
  'Construction & Trades', '11-50', '€1M-€10M', 'Bootstrapped',
  'Innsbruck', 'Austria', 'google_places'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. Lead Scores — one per lead, covering all grades
-- ============================================================

-- Lead 1: HOT (score 87)
INSERT INTO public.lead_scores (
  id, user_id, lead_id, campaign_id,
  total_score, company_fit_score, contact_fit_score, buying_signals_score, timing_score,
  grade, ai_reasoning, recommended_action, confidence, dach_notes, key_insights
) VALUES (
  'f0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  87, 36, 18, 21, 12,
  'HOT',
  'Alpentech GmbH ist ein idealer Zielkunde: Das Unternehmen setzt bereits Salesforce und Tableau ein, wächst stark im DACH-Raum und sucht aktiv nach Möglichkeiten zur Vertriebsoptimierung. Markus Steiner als GF hat direkte Budgetverantwortung. Jüngste Pressemeldung deutet auf Expansion der Sales-Abteilung hin.',
  'Sofort kontaktieren — persönliche E-Mail mit Referenz auf Salesforce-Integration und ROI-Case-Study für ähnliche Unternehmen.',
  0.92,
  'Wiener SaaS-Szene, aktiv bei Austrian Startups und WKO Digital. Handelsregister zeigt 35% Umsatzwachstum YoY.',
  ARRAY['Nutzt Salesforce + Tableau (Tech-Stack Match)', 'GF mit direkter Budgetverantwortung', 'Aktive Hiring-Signale im Sales-Bereich', 'Series B — ausreichend Budget vorhanden']
) ON CONFLICT (lead_id) DO NOTHING;

-- Lead 2: HOT (score 82)
INSERT INTO public.lead_scores (
  id, user_id, lead_id, campaign_id,
  total_score, company_fit_score, contact_fit_score, buying_signals_score, timing_score,
  grade, ai_reasoning, recommended_action, confidence, dach_notes, key_insights
) VALUES (
  'f0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000001',
  82, 35, 17, 19, 11,
  'HOT',
  'Rheindata AG ist ein großes Software-Unternehmen mit starkem Wachstum. Sabine Hoffmann als Head of Sales ist die ideale Ansprechpartnerin für Vertriebsoptimierung. Das Unternehmen evaluiert gerade neue Analytics-Tools laut LinkedIn-Posts.',
  'Zeitnah kontaktieren — LinkedIn-Nachricht mit Bezug auf ihre Posts zu Analytics-Evaluierung. Demo mit Fokus auf Enterprise-Features anbieten.',
  0.88,
  'Frankfurter Fintech-Hub, starke Connections in der DACH-Sales-Community. Aktiv auf LinkedIn mit Thought Leadership zu Revenue Operations.',
  ARRAY['Enterprise-Größe mit passendem Budget', 'Head of Sales — direkter Entscheider', 'Aktive Evaluierung von Analytics-Tools', 'Starke LinkedIn-Präsenz für Social Selling']
) ON CONFLICT (lead_id) DO NOTHING;

-- Lead 3: QUALIFIED (score 74)
INSERT INTO public.lead_scores (
  id, user_id, lead_id, campaign_id,
  total_score, company_fit_score, contact_fit_score, buying_signals_score, timing_score,
  grade, ai_reasoning, recommended_action, confidence, dach_notes, key_insights
) VALUES (
  'f0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000001',
  74, 32, 16, 17, 9,
  'QUALIFIED',
  'Züritec SA ist ein aufstrebendes Finanzdienstleistungsunternehmen in Zürich mit Series-C-Finanzierung. Lukas Meier als VP Sales passt perfekt zur Zielgruppe. Aktuell noch kein konkretes Kaufsignal erkennbar, aber das Unternehmen investiert stark in Digitalisierung.',
  'In Nurture-Sequenz aufnehmen — monatlicher Newsletter mit relevanten Case Studies aus dem Financial-Services-Bereich. In 4-6 Wochen erneut bewerten.',
  0.79,
  'Schweizer Finanzplatz, strenge Compliance-Anforderungen (FINMA). EU-Hosting ist ein Plus.',
  ARRAY['Financial Services — starke Branchenpassung', 'VP Sales als Entscheider', 'Series C — gutes Budget', 'Schweizer Markt erfordert lokale Compliance']
) ON CONFLICT (lead_id) DO NOTHING;

-- Lead 4: QUALIFIED (score 68)
INSERT INTO public.lead_scores (
  id, user_id, lead_id, campaign_id,
  total_score, company_fit_score, contact_fit_score, buying_signals_score, timing_score,
  grade, ai_reasoning, recommended_action, confidence, dach_notes, key_insights
) VALUES (
  'f0000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000001',
  68, 28, 15, 16, 9,
  'QUALIFIED',
  'Bayernsoft GmbH ist ein kleineres SaaS-Unternehmen mit Fokus auf den DACH-Markt. Christina Weber als CRO ist eine ideale Ansprechpartnerin, das Unternehmen ist aber noch in einer frühen Wachstumsphase (Series A). Budget könnte limitiert sein.',
  'Kennenlern-Call vorschlagen — Startup-Pricing und schnellen ROI betonen. Referenz auf ähnliche Series-A-Unternehmen als Kunden.',
  0.75,
  'Münchner Startup-Ökosystem, gut vernetzt in der SaaS-Community. Wahrscheinlich preissensitiv.',
  ARRAY['CRO — perfekte Ansprechpartnerin', 'Kleineres Unternehmen (51-200)', 'Series A — Budget ggf. limitiert', 'SaaS-Branche — versteht Analytics-Mehrwert']
) ON CONFLICT (lead_id) DO NOTHING;

-- Lead 5: ENGAGED (score 58)
INSERT INTO public.lead_scores (
  id, user_id, lead_id, campaign_id,
  total_score, company_fit_score, contact_fit_score, buying_signals_score, timing_score,
  grade, recommended_action, confidence, dach_notes, key_insights
) VALUES (
  'f0000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000005',
  'd0000000-0000-0000-0000-000000000001',
  58, 26, 12, 13, 7,
  'ENGAGED',
  'Branchen-Content zusenden — Manufacturing-spezifische Case Study über Vertriebsoptimierung.',
  0.68,
  'Traditioneller Industriebetrieb, möglicherweise längerer Entscheidungsprozess.',
  ARRAY['Manufacturing — Branchenfit vorhanden', 'Vertriebsleiter als Kontakt', 'Großes Unternehmen mit Budget', 'Traditionell — ggf. langsame Adoption']
) ON CONFLICT (lead_id) DO NOTHING;

-- Lead 6: ENGAGED (score 52)
INSERT INTO public.lead_scores (
  id, user_id, lead_id, campaign_id,
  total_score, company_fit_score, contact_fit_score, buying_signals_score, timing_score,
  grade, recommended_action, confidence, dach_notes, key_insights
) VALUES (
  'f0000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000006',
  'd0000000-0000-0000-0000-000000000001',
  52, 24, 11, 11, 6,
  'ENGAGED',
  'In Nurture-Sequenz aufnehmen. Finanzbranche-Content regelmäßig zusenden.',
  0.62,
  'Schweizer Finanzsektor, FINMA-reguliert. Lange Entscheidungszyklen üblich.',
  ARRAY['Financial Services — guter Fit', 'Head of BizDev — relevanter Kontakt', 'Schweizer Markt — höhere Preisbereitschaft', 'Kein akutes Kaufsignal erkennbar']
) ON CONFLICT (lead_id) DO NOTHING;

-- Lead 7: ENGAGED (score 48)
INSERT INTO public.lead_scores (
  id, user_id, lead_id, campaign_id,
  total_score, company_fit_score, contact_fit_score, buying_signals_score, timing_score,
  grade, recommended_action, confidence, dach_notes, key_insights
) VALUES (
  'f0000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000007',
  'd0000000-0000-0000-0000-000000000001',
  48, 22, 10, 10, 6,
  'ENGAGED',
  'Leiter Marketing — eher indirekter Entscheider für Analytics-Tools. In Long-Term-Nurture aufnehmen.',
  0.58,
  'Berliner Industrie, traditionell, aber zunehmend digitalisierungsaffin.',
  ARRAY['Manufacturing — Branchenfit', 'Marketing-Leiter — nicht primärer Buyer', 'Großes Unternehmen', 'Berlin — guter Markt für SaaS']
) ON CONFLICT (lead_id) DO NOTHING;

-- Lead 8: POTENTIAL (score 38)
INSERT INTO public.lead_scores (
  id, user_id, lead_id, campaign_id,
  total_score, company_fit_score, contact_fit_score, buying_signals_score, timing_score,
  grade, recommended_action, confidence, dach_notes, key_insights
) VALUES (
  'f0000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000008',
  'd0000000-0000-0000-0000-000000000001',
  38, 18, 9, 7, 4,
  'POTENTIAL',
  'Beobachten — kleines Unternehmen mit begrenztem Budget, aber Tech-affin.',
  0.48,
  'Grazer Tech-Szene, kleinere Unternehmen mit begrenztem Budget.',
  ARRAY['Tech-Stack passt grundsätzlich', 'Kleineres Unternehmen', 'Head of Data — technisch orientiert', 'Budget ggf. zu gering']
) ON CONFLICT (lead_id) DO NOTHING;

-- Lead 9: POTENTIAL (score 33)
INSERT INTO public.lead_scores (
  id, user_id, lead_id, campaign_id,
  total_score, company_fit_score, contact_fit_score, buying_signals_score, timing_score,
  grade, recommended_action, confidence, dach_notes, key_insights
) VALUES (
  'f0000000-0000-0000-0000-000000000009',
  '00000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000009',
  'd0000000-0000-0000-0000-000000000001',
  33, 15, 8, 6, 4,
  'POTENTIAL',
  'Langfristig beobachten — CDO ist technischer Entscheider, aber Unternehmensgröße und Budget passen noch nicht optimal.',
  0.42,
  'Hamburger Finanz-Szene, konservativ. Wahrscheinlich lange Entscheidungswege.',
  ARRAY['CDO — technisch orientiert', 'Kleineres Finanzunternehmen', 'Profitable — aber begrenztes Tech-Budget', 'Kein Kaufsignal erkennbar']
) ON CONFLICT (lead_id) DO NOTHING;

-- Lead 10: POOR (score 18)
INSERT INTO public.lead_scores (
  id, user_id, lead_id, campaign_id,
  total_score, company_fit_score, contact_fit_score, buying_signals_score, timing_score,
  grade, recommended_action, confidence, dach_notes, key_insights
) VALUES (
  'f0000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000010',
  'd0000000-0000-0000-0000-000000000001',
  18, 6, 4, 5, 3,
  'POOR',
  'Nicht weiter verfolgen — Branche, Unternehmensgröße und Rolle passen nicht zum ICP.',
  0.25,
  'Tiroler Handwerksbetrieb, genossenschaftlich organisiert. Kein SaaS-affines Umfeld.',
  ARRAY['Branche passt nicht (Construction)', 'Zu klein (11-50 MA)', 'Kein Tech-Budget', 'Betriebsleiter — kein Sales/Data-Entscheider']
) ON CONFLICT (lead_id) DO NOTHING;

-- ============================================================
-- 6. Agent Logs — campaign events
-- ============================================================

INSERT INTO public.agent_logs (
  id, user_id, campaign_id, action_type, message, metadata, created_at
) VALUES
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'campaign_started',
  'Neue Lead-Discovery-Kampagne gestartet. ICP-Profil: DACH B2B, Branchen: Software, Financial Services, Manufacturing. Zielregionen: Österreich, Deutschland, Schweiz.',
  '{"icp_profile_id": "c0000000-0000-0000-0000-000000000001", "target_regions": ["Austria", "Germany", "Switzerland"]}',
  now() - interval '2 hours'
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'leads_discovered',
  '10 potenzielle Leads über Apollo.io gefunden. Branchen-Verteilung: 4x Software & Technology, 3x Financial Services, 2x Manufacturing, 1x Construction. Regionen: 4x Österreich, 3x Deutschland, 3x Schweiz.',
  '{"leads_found": 10, "source": "apollo", "industries": {"Software & Technology": 4, "Financial Services": 3, "Manufacturing": 2, "Construction": 1}}',
  now() - interval '1 hour 55 minutes'
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'lead_scored',
  'KI-Scoring abgeschlossen für 10 Leads. Ergebnis: 2x HOT, 2x QUALIFIED, 3x ENGAGED, 2x POTENTIAL, 1x POOR. Durchschnittlicher Score: 55,8 Punkte. Top-Lead: Markus Steiner (Alpentech GmbH) mit 87 Punkten.',
  '{"leads_scored": 10, "grade_distribution": {"HOT": 2, "QUALIFIED": 2, "ENGAGED": 3, "POTENTIAL": 2, "POOR": 1}, "avg_score": 55.8, "top_lead": "Markus Steiner"}',
  now() - interval '1 hour 50 minutes'
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'website_analyzed',
  'Website-Analyse für 8 Lead-Unternehmen abgeschlossen. Tech-Stacks identifiziert, Impressum-Daten extrahiert, Karriereseiten auf Hiring-Signale geprüft. 3 Unternehmen zeigen aktive Hiring-Signale im Sales-Bereich.',
  '{"websites_analyzed": 8, "tech_stacks_found": 6, "hiring_signals": 3}',
  now() - interval '1 hour 48 minutes'
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'campaign_completed',
  'Kampagne erfolgreich abgeschlossen. 10 Leads gefunden und bewertet. 4 Leads mit hohem Potenzial (HOT/QUALIFIED) identifiziert. Empfehlung: Priorisiert Alpentech GmbH und Rheindata AG für sofortige Kontaktaufnahme.',
  '{"leads_found": 10, "leads_scored": 10, "high_priority": 4, "duration_minutes": 15}',
  now() - interval '1 hour 45 minutes'
)
ON CONFLICT DO NOTHING;
