@AGENTS.md

# Instructions spécifiques à Claude Code

Tu es le **lead** du projet. Tu orchestres des subagents (définis dans `.claude/agents/`) et tu restes responsable de l'intégration et de la qualité finale. Le temps est le facteur limitant : deadline lundi 08:59 (Paris).

## Ordre d'exécution

1. **Setup (toi, séquentiel)**
   - Vérifie les prérequis : `node -v` (≥ 22), `pnpm -v`, `ollama --version` (≥ 0.22), `ollama list` (Gemma 4 présent), whisper-server joignable. S'il manque quelque chose, donne la commande exacte à l'humain et attends.
   - `git init`, `.gitignore`, licence MIT, scaffold du monorepo pnpm, configs partagées (`tsconfig.base.json`, ESLint, Prettier, knip, Vitest).
   - Écris `packages/shared` en premier : c'est le contrat entre le back et le front. Les deux agents suivants partent de là.
   - Premier commit.

2. **Build en parallèle** : lance dans un même message les subagents `backend-engineer`, `frontend-engineer` et `article-writer`. Le back travaille uniquement dans `apps/server`, le front uniquement dans `apps/web`, l'article dans `docs/article/`. Si l'un a besoin de changer `packages/shared`, il te le demande, tu arbitres.

3. **Intégration (toi)** : branche le front sur le vrai back, teste le flux complet avec de l'audio réel. Corrige.

4. **Revue** : lance `code-reviewer` sur l'ensemble. Il ne corrige pas, il liste. Tu dispatches les corrections au bon agent.

5. **Gate final** : skill `quality-gate`. Rien n'est « fini » tant qu'elle ne passe pas à vide.

## Skills à charger

| Situation                                          | Skill                                     |
| -------------------------------------------------- | ----------------------------------------- |
| Écrire du code back                                | `backend-architecture`                    |
| Écrire du code front ou du style                   | `frontend-architecture` + `design-system` |
| Tout flux temps réel (audio, WS, tokens Gemma)     | `reactive-streams`                        |
| Écrire un prompt Gemma ou appeler Ollama / whisper | `local-ai`                                |
| Avant de déclarer une tâche terminée               | `quality-gate`                            |
| Article DEV, README, vidéo                         | `devto-article`                           |

## Règles de conduite

- Commits petits et fréquents, conventional commits.
- Tu ne marques jamais une tâche finie si un test, le typecheck, le lint ou knip échoue.
- Si une décision n'est pas couverte par AGENTS.md et qu'elle coûte plus de 20 minutes à défaire, demande à l'humain.
- Respecte le gel des fonctionnalités à 00:30.
- Si whisper ou Ollama sont lents sur la machine, propose de passer à un modèle plus petit plutôt que de bricoler le code.
- Pense à sauvegarder la session d'agent (DevRelay) : l'article peut l'intégrer, le jury apprécie.
