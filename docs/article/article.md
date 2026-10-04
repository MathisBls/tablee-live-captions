---
title: "My [[À REMPLIR : relation]] stopped following our family dinners. So I built [[À REMPLIR : him/her]] a seat at the table with Gemma."
published: false
tags: devchallenge, weekendchallenge, hf26challenge, gemma
cover_image: "[[À REMPLIR : URL de l'image de couverture 1000x420, photo de Tablée posée sur une vraie table de repas]]"
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

[[À REMPLIR : la scène d'ouverture en 1 ou 2 phrases concrètes (person.md, « La scène ») : quel repas précis (Noël, anniversaire, dimanche midi…), où, qui était autour de la table, de quoi on parlait au moment où la personne a décroché]] [[À REMPLIR : prénom]], my [[À REMPLIR : relation]], [[À REMPLIR : en une demi-phrase, ce que la personne entend et n'entend pas (appareillée ? depuis quand ? à l'aise en tête-à-tête mais pas à plusieurs ?)]]. [[À REMPLIR : ce que la personne a fait à ce moment-là, tel que tu l'as vu (hoche la tête, sourit au mauvais moment, sort son téléphone, part en cuisine…)]] [[À REMPLIR : facultatif, une phrase que la personne a dite à ce sujet, mot pour mot, entre guillemets, avec la traduction anglaise si elle est en français ; sinon supprimer]]

Deaf and hard of hearing people call this *dinner table syndrome*: when everyone talks at once, you nod, smile at the wrong moment, and slowly drop out of a conversation you're sitting right in the middle of.

[[À VÉRIFIER : une fois remplie, l'accroche (tout ce qui précède « What I Built ») doit tenir en 5 phrases maximum]]

## What I Built

**Tablée** (French for "everyone sitting at the same table") is a tablet that sits between the plates and shows the conversation as huge live captions. On top of the captions, Gemma adds what captions alone can't give: what we're talking about, what was just missed, and when someone is speaking to [[À REMPLIR : prénom]].

Why not just captions? A live transcript of a table of six is a wall of text. You can read every word and still have no idea what the conversation is about. What's missing is context, and that's the job I gave to Gemma.

### What are we talking about?

A card in the corner of the screen names the current topic in three to six words. Every 30 seconds or so, Gemma reads the latest stretch of conversation, and the card only changes when the subject does. One glance tells [[À REMPLIR : prénom]] where the table is, without asking anyone to start over.

### What did I miss?

The biggest button on the screen asks the question nobody wants to ask out loud for the third time in one evening. Gemma reads the last three minutes and answers in three short sentences, with first names instead of pronouns. If someone asked [[À REMPLIR : prénom]] a question, that question comes first. If there isn't enough conversation yet, Tablée says so instead of letting the model make something up.

### Someone is talking to you

When someone at the table says [[À REMPLIR : prénom]], or one of the nicknames entered at setup, a soft glow pulses around the edge of the screen and the line with the name is highlighted. If the device can vibrate, it does. This is the one feature that doesn't use Gemma: it's a plain string comparison that forgives small spelling differences, because an alert that arrives late is no alert at all. [[À VÉRIFIER : surlignage de la ligne et vibration réellement livrés dans apps/web]]

### Captions you can read from across the table

The captions come in very large type, with four sizes to choose from. There's a high-contrast mode, and animations calm down when the device asks for reduced motion. The text is set in Atkinson Hyperlegible, a typeface the Braille Institute designed so that letters are hard to mistake for one another. [[À VÉRIFIER : police réellement chargée dans apps/web]]

Before the meal, a short setup screen asks for [[À REMPLIR : prénom]]'s name and nicknames, the guests' first names, and the language of the conversation (French or English). The guests' names go to Whisper as a hint, which gives it a better chance of spelling them right. Then the tablet goes in the middle of the table, and that's it.

## Demo

{% embed [[À REMPLIR : URL YouTube non répertoriée de la vidéo de démo]] %}

[[À REMPLIR : une phrase sur ce que montre la vidéo : vrai repas avec la personne, ou table filmée sans visages par respect pour sa vie privée, ou conversation de test à plusieurs si la personne n'était pas disponible]]

![Tablée on the dinner table, showing live captions and the current topic]([[À REMPLIR : URL capture 1, vue table avec les sous-titres et le carton du sujet]])

![The "What did I miss?" panel with Gemma's three-sentence summary]([[À REMPLIR : URL capture 2, panneau « What did I miss? » avec un vrai résumé de Gemma]])

## Code

{% embed https://github.com/MathisBls/tablee-live-captions %}

Everything is MIT licensed and written in strict TypeScript: a Fastify server, a React app for the tablet, and a small shared package that holds the contract between the two.

## How I Built It

### Two open models, two jobs

Tablée stands on two open-weight models running on the same computer. **Whisper** is the ear: it turns sound into text. **Gemma** is the understanding: it turns that text into context.

Whisper runs through the whisper.cpp server (build b5130, CUDA) with the `ggml-large-v3-turbo` model (1.6 GB). Gemma 4 runs through Ollama 0.35.1 as `gemma4:e4b`: 7.5B parameters, Q4_K_M quantization, 6.6 GB on disk. My machine is a Ryzen 7 9800X3D with an RTX 5070 Ti (16 GB of VRAM) and 31 GB of RAM, on Windows 11. The bigger `gemma4:26b` was out: its 17 GB of weights don't fit in 16 GB of VRAM next to Whisper.

### The flow

```
tablet mic
  │  AudioWorklet: PCM16, mono, 16 kHz, 100 ms frames
  ▼
WebSocket /ws/sessions/:id/audio
  │
  ▼
audio chunker: ~4 s windows, cut on pauses, silence never sent
  │
  ▼
whisper.cpp server (ggml-large-v3-turbo)
  │  text
  ▼
transcript stream, one per table (in memory, expires)
  │
  ├──► caption
  ├──► name detector (no LLM) ──► mention
  ├──► every ~30 s ──► Gemma ──► topic
  │
  ▼
WebSocket /ws/sessions/:id/events ──► tablet (caption, topic, mention, status)

"What did I miss?"  POST /api/sessions/:id/catch-up ──► Gemma ──► tokens over SSE
```

The tablet captures the mic with an AudioWorklet and streams 100 ms frames of 16 kHz audio over a WebSocket. The server cuts that stream into windows of about four seconds, ending on a pause when there is one, and never sends a silent window to Whisper. Each caption then fans out: to the screen, to the name detector, and to the topic watcher. "What did I miss?" is a plain POST that streams Gemma's answer back token by token over Server-Sent Events.

Server and tablet share one contract, a package of zod schemas. WebSocket events are a discriminated union (`snapshot`, `caption`, `topic`, `mention`, `status`), and so is Gemma's stream (`token`, `insufficient_context`, `done`, `error`). Every connection starts with a `snapshot`, so a tablet that reconnects picks the conversation up where it left it.

### Why RxJS

A dinner never sends an "end" event. Audio frames arrive ten times a second for as long as the meal lasts, Whisper returns captions at its own pace, and Gemma answers when it's ready. That's a stream problem, so the server is a set of RxJS pipelines, one per table.

[[À VÉRIFIER : remplacer par l'extrait réel de apps/server après intégration]]

```ts
const segments$ = audio$.pipe(
  chunkAudio({ windowMs: 4_000, silenceRms, maxMs: 6_000 }),
  concatMap((chunk) => transcriber.transcribe(chunk, hints)),
  takeUntil(destroy$),
  share(),
);

const topics$ = segments$.pipe(
  bufferTime(30_000),
  filter((batch) => batch.length > 0),
  exhaustMap((batch) => topicService.describe(batch)),
  distinctUntilChanged(sameLabel),
);
```

`concatMap` sends Whisper one window at a time and keeps captions in order. `exhaustMap` ignores new topic requests while Gemma is still answering the previous one, and `distinctUntilChanged` keeps the card still when the topic hasn't really changed. When a session ends, a single `destroy$` signal tears every pipeline down, and closing the "What did I miss?" panel mid-answer aborts the request to Ollama.

### Prompting for one reader

Gemma's reader isn't a developer. It's someone at a dinner table, reading a few words at a time. So the prompts ask for short, plain sentences, first names instead of pronouns, no jargon and no markdown, always in the language of the conversation.

- The transcript goes inside a `<transcript>` block, and the system prompt says to treat it as data, never as instructions. If someone at the table says "ignore all previous instructions", that belongs in the captions, not in Gemma's behaviour.
- When someone asked the listener a question, the summary starts with that question.
- No guessing. When there isn't enough conversation, the server doesn't call Gemma at all, and the tablet shows a fixed message instead.
- `num_ctx` is pinned at 8192, because Ollama's default 4K context would silently cut off the start of the conversation. Thinking mode is off: at a dinner table, a quick answer beats a long reflection.

Here is a real answer from Gemma during testing. The input was a scripted French conversation, synthesized with Windows voices, in which a made-up family talks to "Mamie" (Grandma). Mamie is a test character, not [[À REMPLIR : prénom]].

> Mamie, tu viendrais avec nous en Bretagne ? Léa et Paul hésitent entre la Bretagne et l'Espagne pour cet été. Inès prévient que pour l'Espagne en août, il fera très chaud.

In English: "Mamie, would you come with us to Brittany? Léa and Paul can't decide between Brittany and Spain for this summer. Inès warns that Spain in August will be very hot." The conversation was in French, so Gemma answered in French. The question asked to the listener comes first, on purpose: if someone at the table is waiting for an answer, that's the first thing to know.

### Whisper is very polite

Give Whisper a few seconds of an almost silent room and it sometimes hears someone say "Merci." (thank you). It's a classic Whisper hallucination, and it showed up in my own test fixtures. Tablée never sends silent windows to Whisper, and it filters out the polite ghosts that still slip through.

### Measured on my machine

| Step | Time |
| --- | --- |
| Whisper, one 4-second window (warm) | about 130 ms |
| Whisper, very first call (CUDA kernels compiling) | 18 s |
| Gemma, first token (model loaded) | 74 to 230 ms |
| Gemma, full three-sentence "What did I miss?" | 250 to 380 ms (about 270 tokens/s) |
| Gemma, cold load | 52 s |

The cold load is why the server warms Gemma up as soon as it starts. Once everything is warm, the models are not the bottleneck: the audio window is. Tablée has to hear about four seconds of speech, or a pause, before it can transcribe anything. [[À VÉRIFIER : latence réelle de bout en bout (phrase prononcée jusqu'au sous-titre affiché), mesurée après intégration]]

### Built to be trusted

[[À VÉRIFIER : confirmer chaque affirmation de cette sous-section dans apps/ après la revue de code]]

Strict TypeScript everywhere, with zod at every boundary: HTTP bodies, WebSocket messages, environment variables, and every line Ollama streams back. The server is split into routes, controllers, services, repositories and clients. Services depend on interfaces, and everything is wired in one composition root. It listens on 127.0.0.1 by default, behind a strict CORS allowlist, Helmet and rate limits.

Nothing is stored. Sessions live in memory and expire, logs never contain what was said, and Gemma's output is always rendered as plain text, never as HTML. `/ready` reports whether Ollama and Whisper are up, and if one of them goes down, the tablet says so clearly instead of freezing.

Tests run on Vitest. For the pipeline, I synthesized multi-voice dialogues with Windows voices, so I could test a full table without real people around it in the middle of the night. [[À VÉRIFIER : résultat du test réel avec un débat télé ou un podcast à plusieurs voix joué à côté du micro]]

### Honest limits

- **No speaker labels.** Tablée shows what was said, not who said it. Gemma can only name people when the table uses names.
- **A few seconds of delay**, set by the audio window, not by the models.
- **Noise.** [[À VÉRIFIER : comportement observé avec le bruit de couverts et les voix qui se chevauchent pendant le test réel]]
- **Two languages.** Prompts and interface speak French and English. Whisper knows many more; I haven't tried them.
- **It wants a GPU.** Every number above comes from a 16 GB graphics card. A machine without a GPU would need the smaller `ggml-small` Whisper model, which I haven't measured.

### Built with AI assistance

I built Tablée with Claude Code: a lead agent planned and integrated the work, and sub-agents handled the server, the tablet app, code review and the first draft of this article. [[À REMPLIR : en une phrase, ce que tu as fait toi-même (spec, choix techniques, tests à table, remise, réécriture de l'article)]] Everything this post says about [[À REMPLIR : prénom]] comes from my own notes, not from a model.

### Credits

Tablée stands on open source: Gemma (Google DeepMind), Whisper (OpenAI, open weights), whisper.cpp and ggml (Georgi Gerganov and contributors), Ollama, Fastify, RxJS, React, Vite, zod, Tailwind CSS, and the Atkinson Hyperlegible typeface (Braille Institute). Thank you all. [[À VÉRIFIER : liste alignée sur les package.json et les polices réellement embarquées]]

## Why Does Open Innovation Matter?

For Tablée, open models aren't a bonus. They decide whether the idea is acceptable at all.

### A family dinner should stay in the room

Think about what gets said around any family table: health news, money worries, gossip about whoever isn't there. Tablée hears all of it. With a cloud speech API and a hosted LLM, every word would leave the house and end up on someone else's servers.

With open weights, the audio goes from the tablet to a computer in the same house and stops there. No account, no upload, and the transcript disappears when the session ends.

### No internet needed

Once the models are downloaded, nothing in Tablée calls out to the internet. The tablet talks to the computer, and the computer talks to nobody. [[À VÉRIFIER : testé pour de vrai avec la connexion internet coupée]] Making it travel, to a restaurant or a house with no wifi, is the next step.

### Free means every day

A tool for dinner table syndrome only helps if it's on the table at every meal. Most group captioning apps run in the cloud and charge a subscription, which turns each dinner into a cost to weigh. Tablée costs nothing per use: the models download once and run as often as [[À REMPLIR : prénom]] wants.

### The right model for the machine

Open models come in sizes, so the setup fits the hardware instead of the other way round. On my 16 GB GPU, `gemma4:e4b` writes a full summary in under 0.4 seconds. A machine with more memory could run `gemma4:26b`, and a computer without a GPU could fall back to a smaller Whisper model. Switching Gemma models is one line in `.env`. [[À VÉRIFIER : variable OLLAMA_MODEL lue par apps/server]]

### Tuned to one table

The guests' names already go into Whisper's prompt. Because the weights are open, the next step is possible too: fine-tuning Whisper on the voices and accents of the people who actually sit at that table, on the same computer, without a single recording leaving the house. With a closed API, I couldn't do that without sending those voices away.

Open models turned "a private assistant for one person's dinners" from a product nobody would build into a weekend project.

## Handing It Over

[[À REMPLIR : quand et où tu as remis Tablée à la personne (quel repas, combien de personnes à table), en 1 ou 2 phrases]]

[[À REMPLIR : comment tu l'as présentée : ce que tu as dit, où tu as posé l'appareil]]

> [[À REMPLIR : la première réaction de la personne, MOT POUR MOT, dans la langue d'origine]]

[[À REMPLIR : si la réaction est en français, sa traduction anglaise entre guillemets ; sinon supprimer]]

[[À REMPLIR : ce qui a marché, avec un moment précis (ex. la première fois que l'alerte du prénom s'est déclenchée, un résumé juste)]]

[[À REMPLIR : ce qui a raté ou gêné la personne, franchement (délai, prénom mal reconnu, bruit, taille du texte…)]]

[[À REMPLIR : ce que la personne a demandé en plus]]

[[À REMPLIR : si la remise n'a pas eu lieu avant la publication, remplacer toute cette section par 2 phrases honnêtes : pas encore remise, quand elle aura lieu, et l'engagement de mettre l'article à jour]]

## What's Next

- **One model for the ear and the brain.** `ollama show` lists audio as an input for `gemma4:e4b`. I haven't tested it yet, but if it transcribes a busy table well enough, Tablée could run on a single model instead of two.
- **Who said what.** Speaker diarization, so captions can say who is talking.
- **Nothing but a phone.** An offline Android app with on-device models, so Tablée can travel to any table.
- [[À REMPLIR : ce que la personne a demandé à la remise, si c'est réaliste ; le mettre en premier et ne garder que 3 pistes au total, sinon supprimer cette ligne]]

## My Agent Session

[[À REMPLIR : lien ou embed DevRelay de la session d'agent ; si elle n'a pas été sauvegardée, supprimer toute cette section]]

## Prize Categories

Best Use of Gemma
