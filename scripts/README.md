# Validation Scripts

## Overview

Ces scripts valident que les 5 améliorations fonctionnent correctement avant déploiement production :

1. **Performance** - faster-whisper (4x plus rapide que openai-whisper)
2. **Observabilité** - Métriques Prometheus exposées
3. **Sécurité** - Rate limiting sur les uploads
4. **Scalabilité** - BullMQ pour traitement async
5. **Tests** - Coverage >= 70%

## Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **Redis** running (localhost:6379)
- **PostgreSQL** running (localhost:5432)
- **FastAPI** running (localhost:8000)
- **NestJS** running (localhost:3000)

### Démarrer les services

```bash
# Terminal 1 - Redis
docker run -d -p 6379:6379 redis:alpine

# Terminal 2 - PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15-alpine

# Terminal 3 - FastAPI (tilawa-core-ai)
cd tilawa-core-ai
source .venv311/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 4 - NestJS (tilawa-app-api)
cd tilawa-app-api
npm run start:dev
```

## Scripts

### 1. benchmark_whisper.py

**Objectif:** Comparer les performances de faster-whisper vs openai-whisper

**Usage:**
```bash
cd tilawa-core-ai
python scripts/benchmark_whisper.py
```

**Output:**
- `scripts/benchmark_results.json` - Résultats détaillés avec RTF (Real-Time Factor)

**Critère de succès:** Au moins un modèle Whisper fonctionne

---

### 2. test_prometheus.py

**Objectif:** Vérifier que les métriques Prometheus sont exposées

**Usage:**
```bash
cd tilawa-core-ai
python scripts/test_prometheus.py
```

**Output:**
- `scripts/metrics_validation.json` - Résultats de validation
- `scripts/grafana_dashboard.json` - Dashboard Grafana minimal

**Métriques vérifiées:**
- `tilawa_transcription_seconds`
- `tilawa_transcription_realtime_factor`
- `tilawa_quran_alignment_seconds`
- `tilawa_quran_detection_total`
- `tilawa_model_load_seconds`

**Critère de succès:** Toutes les métriques sont présentes

---

### 3. test_rate_limit.sh

**Objectif:** Vérifier que le rate limiting fonctionne sur les uploads

**Usage:**
```bash
cd tilawa-app-api
bash scripts/test_rate_limit.sh
```

**Tests effectués:**
- Envoie 15 requêtes POST à `/recordings`
- Vérifie que les premières passent (200/201)
- Vérifie que les suivantes sont bloquées (429)

**Critère de succès:** Réponses 429 après dépassement de la limite

---

### 4. test_bullmq.ts

**Objectif:** Vérifier le flow async avec BullMQ

**Usage:**
```bash
cd tilawa-app-api
npx ts-node scripts/test_bullmq.ts
```

**Output:**
- `scripts/bullmq_test_results.json` - Timeline du traitement

**Tests effectués:**
1. Connexion Redis
2. Upload d'un fichier audio
3. Vérification du job dans la queue
4. Polling jusqu'à completion (max 30s)

**Critère de succès:** Recording passe de UPLOADED → PROCESSING → DONE

---

### 5. run_tests_with_coverage.sh

**Objectif:** Exécuter les tests avec mesure de coverage

**Usage:**
```bash
cd tilawa-core-ai
bash scripts/run_tests_with_coverage.sh
```

**Output:**
- `htmlcov/index.html` - Rapport HTML détaillé

**Critère de succès:** Coverage total >= 70%

---

## Run All Validations

```bash
# Depuis la racine du projet
./scripts/validate_all.sh
```

Ce script master :
1. Vérifie que les services sont running
2. Exécute les 5 scripts de validation
3. Affiche un résumé avec statut par test
4. Liste les fichiers de rapport générés

**Output exemple:**
```
╔════════════════════════════════════════════════════════════╗
║           TILAWA VALIDATION SUITE                          ║
╚════════════════════════════════════════════════════════════╝

  Test                                Duration     Result
  ─────────────────────────────────────────────────────────────
  Performance (faster-whisper)        45s          ✅ PASSED
  Observability (Prometheus)          2s           ✅ PASSED
  Security (Rate Limiting)            5s           ✅ PASSED
  Scalability (BullMQ)                12s          ✅ PASSED
  Tests (Coverage)                    8s           ✅ PASSED
  ─────────────────────────────────────────────────────────────

╔════════════════════════════════════════════════════════════╗
║     FINAL VERDICT: ALL VALIDATIONS PASSED ✅              ║
╚════════════════════════════════════════════════════════════╝
```

---

## CI/CD

Le workflow GitHub Actions `.github/workflows/validate.yml` exécute automatiquement ces validations sur chaque push/PR vers `main`.

**Services utilisés:**
- Redis (service container)
- PostgreSQL (service container)

**Artifacts générés:**
- `benchmark-results` - Fichiers JSON de résultats
- `coverage-report` - Rapport HTML de coverage

---

## Troubleshooting

### FastAPI ne démarre pas

```bash
# Vérifier les dépendances
cd tilawa-core-ai
pip install -r requirements.txt

# Vérifier les erreurs
uvicorn app.main:app --reload --port 8000
```

### NestJS ne démarre pas

```bash
# Vérifier les dépendances
cd tilawa-app-api
npm install

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# Démarrer
npm run start:dev
```

### Redis non accessible

```bash
# Vérifier que Redis tourne
redis-cli ping

# Ou démarrer avec Docker
docker run -d -p 6379:6379 redis:alpine
```

### BullMQ test échoue avec "User not found"

```bash
# Créer un utilisateur de test dans la DB
cd tilawa-app-api
npx prisma db execute --stdin <<EOF
INSERT INTO "User" (id, email, name, "createdAt", "updatedAt")
VALUES ('test-bullmq-user', 'test@tilawa.app', 'Test User', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
EOF
```

### Coverage trop bas

```bash
# Voir le rapport détaillé
cd tilawa-core-ai
open htmlcov/index.html

# Identifier les fichiers non couverts et ajouter des tests
```

### Métriques Prometheus manquantes

```bash
# Vérifier que les métriques sont bien définies
curl http://localhost:8000/metrics | grep tilawa

# Si manquantes, vérifier app/utils/metrics.py et app/main.py
```

---

## Structure des fichiers

```
tilawa/
├── scripts/
│   ├── validate_all.sh          # Script master
│   └── README.md                # Cette documentation
├── tilawa-core-ai/
│   └── scripts/
│       ├── benchmark_whisper.py
│       ├── test_prometheus.py
│       └── run_tests_with_coverage.sh
├── tilawa-app-api/
│   └── scripts/
│       ├── test_rate_limit.sh
│       └── test_bullmq.ts
└── .github/
    └── workflows/
        └── validate.yml         # CI/CD workflow
```
