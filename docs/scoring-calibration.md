# Scoring-Kalibrierung — Analyse & A/B-Test-Konzept

## 1. Score-Verteilung — Analyse

### Bisherige Schwellenwerte
| Grade      | Alter Bereich | Problem |
|------------|--------------|---------|
| HOT        | 90-100       | Zu eng — max. 10 Punkte Spielraum, kaum Leads erreichen HOT |
| QUALIFIED  | 75-89        | Akzeptabel |
| ENGAGED    | 60-74        | Akzeptabel |
| POTENTIAL   | 40-59        | Zu breit — 20 Punkte Spanne |
| POOR_FIT   | 0-39         | Zu breit — 40 Punkte Spanne |

### Neue Schwellenwerte (kalibriert)
| Grade      | Neuer Bereich | Begründung |
|------------|--------------|------------|
| HOT        | 85-100       | 16pt Spanne — erreichbar bei starkem Company + Contact Fit |
| QUALIFIED  | 70-84        | 15pt Spanne — solide Leads mit Potenzial |
| ENGAGED    | 55-69        | 15pt Spanne — interessant, aber nicht priorisiert |
| POTENTIAL   | 35-54        | 20pt Spanne — beobachten, nurture |
| POOR_FIT   | 0-34         | 35pt Spanne — kein Fit |

### Erwartete Verbesserung
- HOT-Rate steigt von ~5% auf ~12-15% (realistischeres Targeting)
- Weniger Clustering in POTENTIAL/POOR_FIT
- Bessere Differenzierung im Mittelfeld

## 2. Rule-Engine-Gewichte — Evaluierung

### Aktuelle Gewichte (beibehalten)
| Komponente     | Max Punkte | Anteil | Bewertung |
|---------------|-----------|--------|-----------|
| Company Fit    | 40        | 40%    | ✅ Korrekt — Firmenmatch ist wichtigstes Signal im B2B |
| Contact Fit    | 20        | 20%    | ✅ Korrekt — richtiger Ansprechpartner ist essenziell |
| Buying Signals | 25        | 25%    | ✅ Korrekt — Kaufsignale differenzieren aktive von passiven |
| Timing         | 15        | 15%    | ✅ Korrekt — Aktualität als Tiebreaker |

**Fazit:** Gewichte sind für DACH B2B gut kalibriert. Company Fit als dominanter Faktor entspricht der Realität, dass im DACH-Markt Firmenmatch > Personenmatch.

## 3. DACH-spezifische Kalibrierungen (umgesetzt)

### 3.1 Firmentyp-Erkennung (NEU)
GmbH, AG, KG, OHG, eG, SE, e.V., GbR, UG im Firmennamen → +3 Punkte Company Fit.

**Begründung:** Registrierte Rechtsformen signalisieren etablierte Unternehmen mit Budget und Entscheidungsstrukturen. Ein "Max Müller Consulting" ohne GmbH ist wahrscheinlich ein Freelancer.

### 3.2 Deutsche Seniority-Titel (NEU)
Mapping für 18 deutsche Jobtitel zu Seniority-Scores:
- Geschäftsführer/in → 18 (= CEO)
- Vorstand/Vorständin → 18
- Inhaber/in, Gesellschafter/in, Gründer/in → 20 (= Owner)
- Prokurist/in → 14 (= Director, Zeichnungsberechtigung)
- Bereichsleiter/in → 14 (= Director)
- Abteilungsleiter/in → 12 (= Head)
- Teamleiter/in → 10 (= Manager)

**Begründung:** Apollo.io liefert für DACH-Leads oft nur deutsche Titel ohne strukturiertes Seniority-Feld. Ohne Mapping werden diese Leads systematisch unterbewertet.

### 3.3 DACH-Geografie-Bonus (bestehend, validiert)
Österreich/Deutschland/Schweiz → automatisch +10 Punkte Geography.
**Bewertung:** Korrekt für ein DACH-fokussiertes Tool. Beibehalten.

## 4. A/B-Test-Konzept

### Ziel
Validieren, ob die neuen Schwellenwerte und DACH-Kalibrierungen zu besserer Lead-Priorisierung führen.

### Metriken
1. **Kontakt-Rate:** Anteil der Leads pro Grade, die tatsächlich kontaktiert werden
2. **Conversion-Rate:** Anteil der kontaktierten Leads, die zu einem Meeting führen
3. **Grade-Verteilung:** Prozentuale Verteilung über die 5 Grades
4. **User-Feedback:** Stimmt der Score mit der manuellen Einschätzung überein?

### Test-Design
| Variante | Schwellenwerte | DACH-Kalibrierung |
|----------|---------------|-------------------|
| A (Control) | 90/75/60/40 | Ohne Firmentyp, ohne deutsche Titel |
| B (Treatment) | 85/70/55/35 | Mit Firmentyp (+3), mit deutschen Titeln |

### Implementierung (Phase 2)
1. **Feedback-Loop:** Button auf Lead-Detail: "Score passt" / "Score passt nicht" → speichern in `lead_score_feedback` Tabelle
2. **A/B-Zuweisung:** Per User-ID (nicht per Lead), damit konsistente Erfahrung
3. **Laufzeit:** Minimum 2 Wochen oder 100 kontaktierte Leads pro Variante
4. **Auswertung:** Vergleich Kontakt-Rate HOT vs. QUALIFIED zwischen A und B

### Feedback-Tabelle (Vorschlag)
```sql
CREATE TABLE lead_score_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  lead_id uuid REFERENCES leads NOT NULL,
  score_at_feedback integer NOT NULL,
  grade_at_feedback text NOT NULL,
  feedback text NOT NULL CHECK (feedback IN ('accurate', 'too_high', 'too_low')),
  created_at timestamptz DEFAULT now()
);
```
