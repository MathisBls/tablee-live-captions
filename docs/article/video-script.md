# Tablée, script de la vidéo de démo (60 à 90 s)

Durée cible : **85 s**. Format 16:9, 1080p. Upload YouTube **non répertorié**, lien dans la section Demo de l'article (`{% embed <url> %}`).

## Deux règles avant tout

**La vidéo se comprend sans le son.** Tablée sert à quelqu'un qui entend mal : tout passe par l'image et le texte à l'écran. Le son de la table reste en fond, bas. Toute parole audible en français est sous-titrée en anglais (incrustée ou fichier CC YouTube).

**Rien n'est truqué.** Les sous-titres, le carton du sujet et le résumé à l'écran sont ceux que Tablée a vraiment produits pendant la prise. Si l'alerte du prénom rate, on refait la prise, on ne la fabrique pas au montage. Pas de coupe qui fasse croire à une latence nulle : l'article annonce quelques secondes de délai, la vidéo le montre tel quel. On ne dirige pas les réactions de la personne : on filme ce qui se passe.

## Avant de tourner

- [ ] Accord de chaque personne filmée (visage, voix). Pour la personne elle-même : réponse notée dans `person.md`. Sinon, variante sans visages plus bas.
- [ ] Serveur lancé **au moins 1 minute avant** la prise : Gemma met 52 s à charger à froid. Attendre que `/ready` soit vert.
- [ ] Une phrase d'essai avant la vraie prise : le tout premier appel à Whisper prend 18 s (compilation des noyaux CUDA).
- [ ] Écran d'accueil rempli avec le vrai prénom, les surnoms, les prénoms des convives et la langue.
- [ ] Taille du texte au cran par défaut, luminosité de l'écran au maximum, notifications coupées, mise en veille désactivée.
- [ ] Appareil au centre de la table, micro dégagé (pas derrière une carafe ni collé à une assiette).
- [ ] Filmer **3 à 5 minutes de conversation continue** : le carton du sujet ne change qu'environ toutes les 30 s, et seulement si le sujet change. Il faut de la matière pour monter.
- [ ] Consigne à un convive, sans dialogue écrit : changer franchement de sujet à un moment, puis appeler la personne par son prénom de façon naturelle.
- [ ] Musique libre de droits ou aucune (sinon blocage YouTube).

## Plan par plan

| # | Temps | Image | Ce qui se passe | Texte à l'écran (EN) | Son |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 à 8 s | Plan large de la table, conversation animée. La personne est dans le cadre, en retrait de l'échange. | Le brouhaha d'un repas à plusieurs. | `For [[À REMPLIR : prénom]], family dinners are just noise.` | Son de la table, niveau normal. |
| 2 | 8 à 25 s | Une main pose la tablette au milieu de la table. Gros plan sur l'écran. | Les sous-titres arrivent en très gros. Plus tard dans la prise, le carton du sujet change (monter les deux moments). | `Live captions, big enough to read across the table.` puis `Gemma names the topic.` | Son de la table, baissé. |
| 3 | 25 à 40 s | Plan serré sur un convive, puis sur l'écran, puis sur la personne. | Le convive dit le prénom. Quelques secondes plus tard, le sous-titre arrive et la lueur pulse autour de l'écran. On filme la réaction réelle de la personne. | `Someone says [[À REMPLIR : prénom]]. The screen lights up.` | La phrase du convive audible, sous-titrée en anglais. |
| 4 | 40 à 60 s | Gros plan : le doigt de la personne appuie sur le bouton « What did I miss? » (ou « Qu'est-ce que j'ai raté ? » si la session est en français). | Le panneau monte, le résumé de Gemma s'affiche. Gemma écrit les 3 phrases en moins d'une demi-seconde : **tenir le plan 5 s sur le résumé complet** pour qu'on ait le temps de le lire. | `"What did I miss?" Gemma sums up the last 3 minutes.` + traduction anglaise du résumé en sous-titre s'il est en français. | Son de la table, bas. |
| 5 | 60 à 75 s | Écran noir. | Trois cartons successifs, environ 5 s chacun. | `Runs on one computer at home.` / `No internet. Nothing leaves the house.` / `Gemma + Whisper. Open weights.` | Silence ou musique douce. |
| 6 | 75 à 85 s | Nom de l'appli sur fond sombre. | | `Tablée` puis `github.com/MathisBls/tablee-live-captions` | Silence. |

Notes sur les cartons :

- Plan 1 : [[À VÉRIFIER : la phrase doit coller à ce que `person.md` dit de la personne. Si elle ne colle pas, variante neutre : `Dinner table syndrome: everyone talks, someone gets left out.`]]
- Plan 5 : la skill propose `Runs on a laptop. No internet. Nothing leaves the table.` [[À VÉRIFIER : les mesures ont été faites sur un PC fixe (Ryzen 7 9800X3D, RTX 5070 Ti). Garder « laptop » seulement si la démo tourne vraiment sur un laptop. Garder « No internet » seulement si on a testé avec la connexion coupée ; on peut alors montrer l'icône wifi barrée à l'écran.]]
- Plan 6, facultatif : ajouter `Built for [[À REMPLIR : prénom]].` uniquement si la personne est d'accord pour être nommée.

## Variante sans visages

Si la personne ne veut pas être filmée, on filme la table d'en haut : mains, assiettes, verres, tablette. L'article le dit en une phrase dans la section Demo (marqueur déjà prévu).

| # | Changement par rapport au plan principal |
| --- | --- |
| 1 | Plongée verticale sur la table : assiettes, verres, mains qui parlent, le pain qui circule. Les mains de la personne dans le cadre. Même carton. |
| 2 | Inchangé (déjà sans visage). |
| 3 | On entend le prénom (sous-titré en anglais). Gros plan sur l'écran : la lueur pulse. Si l'appareil vibre, on voit la tablette frémir sur la nappe (un laptop ne vibre pas). Puis ce que font réellement les mains de la personne. |
| 4 | Inchangé (le doigt sur le bouton suffit). |
| 5 et 6 | Inchangés. |

## Variante si la personne n'est pas disponible pour le tournage

Trois personnes qui parlent vraiment, ou un débat télé ou un podcast à plusieurs voix joué à côté du micro. Le plan 1 perd le prénom (utiliser la variante neutre), le plan 3 utilise le prénom d'un participant configuré à l'accueil. L'article doit alors dire clairement que la vidéo est une démo de test, pas la remise.

## Montage et mise en ligne

- Cartons : 8 mots maximum, 2,5 s minimum à l'écran, texte clair sur fond sombre, police très lisible (Atkinson Hyperlegible si elle est installée).
- Export 1080p, YouTube non répertorié.
- Titre YouTube : `Tablée: live captions and Gemma context for dinner table syndrome (Hacktoberfest Weekend Challenge)`.
- Description YouTube : lien vers l'article, lien vers le repo, crédits (Gemma, Whisper, whisper.cpp, Ollama).
