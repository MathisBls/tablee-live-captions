# Tablée — spec projet (source de vérité pour tous les agents)

> Hacktoberfest Weekend Challenge DEV : « Build for a Friend ».
> **Deadline de publication de l'article : lundi 5 octobre 2026, 08:59 heure de Paris (06:59 UTC).** Viser 08:15.
> Catégorie visée : **Best Use of Gemma** + prix général.

## 1. Le projet en une phrase

Tablée donne une place à la table à un proche qui entend mal : une tablette posée au milieu du repas affiche les sous-titres de la conversation en direct, et Gemma ajoute ce que les sous-titres seuls ne donnent pas : **de quoi on parle, ce qu'il a raté, pourquoi tout le monde rit, et quand quelqu'un s'adresse à lui.** Tout tourne en local, rien ne quitte la maison.

Le problème a un nom dans la communauté sourde et malentendante : le **« dinner table syndrome »**. Au repas de famille, la personne qui entend mal décroche, hoche la tête, sourit au mauvais moment, puis finit par se taire. Les sous-titres bruts ne suffisent pas : à six qui parlent en même temps, un mur de texte reste un mur. Ce qui manque, c'est le **contexte**.

## 2. Pourquoi ce projet coche les critères du jury

| Critère (ordre de poids)           | Comment on le coche                                                                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Qualité d'écriture (le plus lourd) | Une vraie personne, une vraie scène (le repas), un nom connu (« dinner table syndrome »), la remise de l'appli racontée avec sa réaction. Voir `.claude/skills/devto-article`. |
| Pertinence (IA open au cœur)       | Deux modèles open-weight en local : Whisper (l'oreille) et Gemma (la compréhension). Sans eux, l'appli n'existe pas.                                                           |
| Créativité                         | Aucune soumission ne traite l'accessibilité auditive. Le twist : pas juste des sous-titres, une **couche de contexte** générée par Gemma.                                      |
| Exécution technique                | Ça marche en vrai à table, code TypeScript strict, architecture en couches, flux réactifs RxJS, observabilité, tests sur la logique cœur.                                      |
| Partenaire (Gemma)                 | Gemma est le cerveau de toutes les fonctions à valeur ajoutée, en local via Ollama. Tag `gemma` sur l'article.                                                                 |

**Pourquoi l'open compte ici (argument central de l'article)** : une conversation de famille est intime, elle ne doit jamais partir chez un tiers. Ça marche sans réseau (au resto, chez les grands-parents sans wifi). Coût zéro à l'usage, donc la personne peut s'en servir tous les jours sans abonnement (les apps de sous-titrage de groupe existantes sont payantes et cloud). On peut changer de modèle selon la machine.

## 3. Règles du concours à respecter (non négociables)

- Projet **nouveau**, démarré et fini dans la fenêtre du challenge. Tout commit après la deadline doit être signalé dans le README.
- Repo GitHub **public**, licence **MIT**.
- Article **en anglais** (sinon pas éligible aux prix).
- Toute brique open source réutilisée est **créditée** dans le README et l'article (whisper.cpp, Ollama, Gemma, Whisper, libs).
- L'IA est autorisée. Déclarer l'assistance IA sur DEV. Option bonus : sauvegarder la session d'agent avec DevRelay et l'intégrer dans l'article.
- Démo : **vidéo** (lien YouTube non répertorié ou upload). Pas d'hébergement obligatoire : l'intérêt du projet est justement qu'il tourne en local.

## 4. Fonctionnalités (périmètre MVP strict)

Priorité P0 = obligatoire pour la démo. P1 = si P0 fini et testé. Rien d'autre.

### P0

1. **Sous-titres live** : le micro de l'appareil capte la table, sous-titres qui défilent en très gros caractères, latence cible < 5 s.
2. **Bandeau « On parle de… »** : Gemma résume le sujet en cours en 3 à 6 mots, rafraîchi toutes les ~30 s ou à chaque changement de sujet détecté.
3. **Bouton « Qu'est-ce que j'ai raté ? »** : Gemma résume les 3 dernières minutes en 3 phrases courtes et simples.
4. **Alerte « On te parle »** : quand le prénom de la personne (ou ses surnoms) est prononcé, l'écran pulse doucement + vibration si dispo. Détection déterministe (normalisation + distance de Levenshtein), pas de LLM ici (latence).
5. **Écran d'accueil** : prénom de la personne + surnoms + prénoms des convives (ces prénoms sont injectés dans le prompt Whisper pour mieux les reconnaître) + langue de la conversation.
6. **Réglages accessibilité** : taille du texte (4 crans, défaut très grand), contraste élevé, réduction des animations (respecte `prefers-reduced-motion`).

### P1

7. **Bouton « Pourquoi ça rit ? »** : Gemma explique en une phrase ce qui a fait rire sur les 30 dernières secondes.
8. **Mode « Prendre la parole »** : la personne tape une phrase, l'appli l'affiche en grand vers la table (retournement d'écran) ou la lit à voix haute (`speechSynthesis`, voix locale).

### Hors périmètre (ne pas coder, mentionner comme limites dans l'article)

Diarisation (qui parle), comptes utilisateurs, base de données persistante, hébergement, appli native.

## 5. Stack technique

| Couche     | Choix                                                                                          | Notes                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Monorepo   | pnpm workspaces                                                                                | `apps/server`, `apps/web`, `packages/shared`                                                                 |
| Langage    | TypeScript 5, `strict: true` partout                                                           | voir §7                                                                                                      |
| Back       | Fastify 5                                                                                      | `@fastify/websocket`, `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `fastify-type-provider-zod` |
| Validation | zod                                                                                            | toutes les entrées (HTTP, WS, env, réponses LLM)                                                             |
| Flux       | RxJS 7                                                                                         | audio → segments → sous-titres → clients, tokens Gemma                                                       |
| LLM        | **Gemma 4 via Ollama**                                                                         | défaut `gemma4:e4b`, `gemma4:26b` si la machine encaisse. Fixer `num_ctx` (Ollama met 4K par défaut).        |
| ASR        | **whisper.cpp server** (`whisper-server`)                                                      | modèle multilingue : `ggml-large-v3-turbo` (GPU) ou `ggml-small` (CPU). Endpoint `POST /inference`.          |
| Front      | Vite + React 19 + TypeScript                                                                   | RxJS côté client pour le WebSocket                                                                           |
| Style      | Tailwind CSS v4 + tokens CSS                                                                   | identité visuelle dans `.claude/skills/design-system`                                                        |
| Tests      | Vitest                                                                                         | logique cœur back + hooks/utilitaires front                                                                  |
| Qualité    | ESLint (typescript-eslint `strictTypeChecked`), Prettier, **knip** (code mort), `tsc --noEmit` | voir `.claude/skills/quality-gate`                                                                           |
| Logs       | pino (intégré à Fastify), `pino-pretty` en dev                                                 |                                                                                                              |

**On ne fork pas une appli existante** : on hériterait du code de quelqu'un d'autre, à l'opposé de nos exigences de propreté. On s'appuie sur des briques open source éprouvées (whisper.cpp, Ollama, Gemma, Whisper) et on les crédite.

## 6. Architecture

### Flux de données

```
[Micro tablette]
   │ AudioWorklet → PCM16 mono 16 kHz, trames de 100 ms
   ▼
WebSocket /ws/sessions/:id/audio  ──►  AudioChunker (Rx)  ── fenêtres ~4 s, coupe sur silence (RMS)
                                              │
                                              ▼
                                   WhisperClient → whisper-server /inference
                                              │ texte
                                              ▼
                              TranscriptService (Rx Subject par session)
                                │                │                 │
                                ▼                ▼                 ▼
                     SessionRepository   NameDetector        TopicService (debounce/throttle 30 s → Gemma)
                       (en mémoire)        (déterministe)            │
                                │                │                 │
                                └────────► WebSocket /ws/sessions/:id/events ◄┘
                                              (captions, topic, mention)

[Bouton] POST /api/sessions/:id/catch-up  → CatchUpService → Gemma (stream) → SSE vers le client
[Bouton] POST /api/sessions/:id/laugh     → LaughService   → Gemma
```

### Back : `apps/server/src`

```
src/
├── main.ts                     # point d'entrée : charge la config, buildApp, listen, arrêt propre (SIGINT/SIGTERM)
├── app.ts                      # buildApp(): enregistre plugins http, observability, routes, error handler
├── container.ts                # composition root : instancie clients, repos, services, controllers (DI manuelle, pas de framework)
├── config/
│   └── env.ts                  # schéma zod des variables d'env, échoue au démarrage si invalide
├── interfaces/                 # TOUS les contrats et types internes du back
│   ├── clients/                # ILlmClient, ITranscriber
│   ├── repositories/           # ISessionRepository
│   ├── services/               # ITranscriptService, ITopicService, ICatchUpService, INameDetector...
│   ├── http/                   # types de contexte requête, enveloppe de réponse
│   └── index.ts
├── models/                     # entités du domaine (TableSession, CaptionSegment, Mention, Topic) + leurs fabriques
├── schemas/                    # schémas zod des payloads HTTP/WS (les types en sont inférés dans interfaces/)
├── routes/                     # déclaration des routes uniquement (méthode, url, schéma, handler du controller)
│   ├── health.routes.ts
│   ├── sessions.routes.ts
│   ├── ai.routes.ts
│   └── ws.routes.ts
├── controllers/                # adaptent HTTP/WS ↔ services, aucune logique métier
├── services/                   # logique métier, flux Rx
├── repositories/               # SessionRepository en mémoire (Map + TTL), implémente ISessionRepository
├── clients/                    # OllamaClient (implémente ILlmClient), WhisperClient (implémente ITranscriber)
├── prompts/                    # prompts Gemma versionnés, fonctions pures testables
├── streams/                    # opérateurs Rx réutilisables (chunkAudio, wavEncode, retryWithBackoff)
├── http/
│   ├── plugins/                # cors.ts (allowlist depuis env), helmet.ts, rate-limit.ts, request-id.ts
│   ├── responses/              # helpers d'enveloppe { data } / { error }
│   └── hooks/                  # onRequest/onResponse (timing)
├── errors/
│   ├── app-error.ts            # classe de base : code, statusCode, message public, cause
│   ├── domain-errors.ts        # SessionNotFoundError, TranscriberUnavailableError, LlmUnavailableError, ValidationError
│   └── error-handler.ts        # setErrorHandler + setNotFoundHandler : mapping vers JSON, jamais de stack en réponse
└── observability/
    ├── logger.ts               # options pino, redaction (pas de texte de conversation dans les logs en prod)
    ├── metrics.ts              # compteurs/latences en mémoire (segments transcrits, latence whisper, latence gemma)
    └── health.ts               # /health (liveness) et /ready (ping Ollama + whisper)
```

Chaque dossier a un `index.ts` qui exporte son API publique. Les tests vivent à côté du code (`*.test.ts`).

### Shared : `packages/shared/src`

Types et schémas zod **partagés front/back** : événements WebSocket (union discriminée sur `type`), payloads REST, `SessionSettings`, `CaptionSegment`, `TopicUpdate`, `MentionAlert`. Le front n'importe jamais de code du back, seulement `@tablee/shared`.

### Front : `apps/web/src`

```
src/
├── main.tsx
├── app/                        # App.tsx, providers (SessionProvider, SettingsProvider), routing simple (onboarding → table)
├── pages/                      # OnboardingPage, TablePage
├── features/
│   ├── captions/               # CaptionStream, CaptionLine, useCaptions
│   ├── topic/                  # TopicBanner, useTopic
│   ├── catch-up/               # CatchUpSheet, useCatchUp
│   ├── mention/                # MentionPulse, useMentionAlert
│   ├── speak/                  # (P1) SpeakMode
│   └── settings/               # SettingsSheet, useSettings
├── components/
│   ├── ui/                     # primitives réutilisables : Button, IconButton, Chip, Sheet, Slider, Toggle, TextField, Card, Spinner
│   └── layout/                 # TableLayout, SafeArea
├── services/
│   ├── api/                    # client REST typé (fetch + validation zod des réponses)
│   ├── realtime/               # connexion WS en Observable (rxjs/webSocket), reconnexion avec backoff
│   └── audio/                  # micCapture.ts + worklet pcm-worklet.ts (downsample 16 kHz)
├── hooks/                      # useObservable, useWakeLock, useReducedMotion
├── interfaces/                 # types propres au front (props partagées, états d'UI)
├── styles/                     # tokens.css, fonts.css, globals.css
└── assets/
```

Règle composants : une primitive `ui/` ne connaît aucun métier. Une `feature/` compose des primitives et un hook. Les pages assemblent des features.

## 7. Règles de code (bloquantes en revue)

- **Zéro `any`**, explicite ou implicite. Pas de `as` sauf `as const`. Données externes = `unknown` puis parsing zod.
- **Les types vivent dans `interfaces/`** (ou `packages/shared` s'ils traversent le réseau). Pas de `type`/`interface` déclarés dans un fichier d'implémentation, sauf les props d'un composant React dans son propre fichier `*.types.ts` à côté.
- Chaque service dépend d'**interfaces**, jamais d'implémentations concrètes. L'injection se fait dans `container.ts`.
- Controllers fins : valider, appeler le service, formater. Zéro logique métier.
- **Aucun code mort** : pas de fichier, export, dépendance, paramètre ou branche inutilisés, pas de code commenté, pas de `TODO` laissé. `knip` doit passer à vide.
- Pas de `console.log` : logger pino côté back, rien côté front en prod.
- Fonctions courtes, noms explicites, pas d'abréviations. Pas de commentaires qui paraphrasent le code ; commenter seulement le _pourquoi_.
- Toute erreur est une `AppError` typée, attrapée par le handler central. Jamais de stack ou de message interne renvoyé au client.
- Observables : toujours `takeUntil`/`finalize` ou désabonnement explicite à la fermeture du socket. Pas de fuite d'abonnement.
- Conventional commits (`feat:`, `fix:`, `chore:`…), commits petits et fréquents.

## 8. Sécurité

- CORS : allowlist stricte depuis `CORS_ORIGINS` (liste séparée par virgules, validée). Pas de `*`.
- Helmet activé, rate-limit sur toutes les routes REST (plus strict sur les routes Gemma).
- Taille max du body REST, taille max des messages WS, nombre max de sessions et de clients par session.
- Validation zod de chaque entrée. ID de session = UUID v4 généré côté serveur.
- Le serveur écoute sur `127.0.0.1` par défaut ; `HOST=0.0.0.0` seulement en démo LAN.
- Aucune donnée de conversation persistée : sessions en mémoire avec TTL, purge à la fermeture. Les logs ne contiennent jamais le texte transcrit (redaction pino).
- Les sorties de Gemma sont du texte affiché, jamais injecté en HTML (pas de `dangerouslySetInnerHTML`).
- Prompt injection : le transcript est passé à Gemma dans un bloc délimité et le prompt système précise de le traiter comme des données.

## 9. Variables d'environnement (`apps/server/.env.example`)

```
HOST=127.0.0.1
PORT=3001
CORS_ORIGINS=https://localhost:5173
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma4:e4b
OLLAMA_NUM_CTX=8192
WHISPER_URL=http://127.0.0.1:8080
SESSION_TTL_MINUTES=240
MAX_SESSIONS=5
LOG_LEVEL=info
```

## 10. Lancer en local (Windows)

1. Ollama ≥ 0.22 : `ollama pull gemma4:e4b`
2. whisper.cpp : télécharger le binaire Windows depuis les releases GitHub de whisper.cpp + un modèle ggml multilingue, puis `whisper-server -m models/ggml-large-v3-turbo.bin --port 8080 -l auto`
3. `pnpm install`
4. `pnpm dev` (lance server + web en parallèle)

**Piège micro** : `getUserMedia` exige un contexte sécurisé. `localhost` passe ; une tablette qui ouvre `http://192.168.x.x` n'aura **pas** accès au micro. Pour la démo sur tablette : `@vitejs/plugin-basic-ssl` côté Vite + proxy Vite vers le back (`/api`, `/ws`), et `HOST=0.0.0.0` côté serveur. Le plus simple pour la vidéo : un laptop posé sur la table.

**Wake lock** : l'écran ne doit pas se mettre en veille pendant le repas (`navigator.wakeLock`).

## 11. Planning de la nuit (heure de Paris)

| Créneau          | Qui                                                   | Quoi                                                                                                  |
| ---------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 18:00–18:45      | lead                                                  | Install Ollama + Gemma, whisper.cpp + modèle, scaffold monorepo, `packages/shared` (contrats WS/REST) |
| 18:45–22:30      | backend-engineer ∥ frontend-engineer ∥ article-writer | Back P0 / Front P0 + design / premier jet de l'article à partir de la section « la personne »         |
| 22:30–23:30      | lead                                                  | Intégration bout en bout, test réel avec 2-3 personnes qui parlent                                    |
| 23:30–00:30      | code-reviewer puis corrections                        | Quality gate complet, revue sécurité                                                                  |
| 00:30–01:30      | lead                                                  | P1 si tout est vert, README, captures d'écran                                                         |
| 01:30–02:30      | humain                                                | Enregistrer la vidéo de démo (vraie scène de repas ou conversation à plusieurs)                       |
| Dès que possible | humain                                                | **Remise à la personne + noter sa réaction mot pour mot** (bonus jury)                                |
| 06:30–08:15      | humain + article-writer                               | Finaliser l'article, relire à voix haute, publier                                                     |

Point d'arrêt dur : à **00:30**, plus aucune nouvelle fonctionnalité. On ne fait que stabiliser.

## 12. Definition of Done

- `pnpm typecheck`, `pnpm lint`, `pnpm knip`, `pnpm test`, `pnpm build` passent à vide.
- Démo réelle : 3 personnes parlent 2 minutes, les sous-titres suivent, le bandeau sujet change, « Qu'est-ce que j'ai raté ? » répond juste, le prénom déclenche l'alerte.
- `/ready` renvoie l'état d'Ollama et de whisper ; si l'un tombe, l'UI l'affiche proprement au lieu de planter.
- README : pitch, capture, prérequis, lancement, architecture (le schéma du §6), crédits, licence MIT, note sur les commits post-deadline s'il y en a.
