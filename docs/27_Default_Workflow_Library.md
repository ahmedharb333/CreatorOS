# 27 — Default Workflow Library

## Workflow principles

- Tasks are generated backward from planned publication.
- Durations are defaults and remain editable.
- Required tasks cannot be removed without confirmation.
- Optional tasks can be excluded during creation.
- Dependencies must be explicit.
- Each workflow includes post-publication review.

## 1. YouTube Long-Form

| Seq | Task | Type | Default Minutes | Offset Days | Depends On | Required |
|---:|---|---|---:|---:|---:|---:|
| 1 | Research topic | Research | 120 | -10 | — | Yes |
| 2 | Define angle and promise | Strategy | 45 | -9 | 1 | Yes |
| 3 | Build outline | Writing | 60 | -8 | 2 | Yes |
| 4 | Draft script | Writing | 180 | -7 | 3 | Yes |
| 5 | Review script | QA | 60 | -6 | 4 | Yes |
| 6 | Record video or voiceover | Recording | 120 | -5 | 5 | Yes |
| 7 | Edit first cut | Editing | 240 | -4 | 6 | Yes |
| 8 | Create thumbnail | Design | 90 | -3 | 2 | Yes |
| 9 | Final QA | QA | 60 | -2 | 7,8 | Yes |
| 10 | Upload and metadata | Publishing | 60 | -1 | 9 | Yes |
| 11 | Publish | Publishing | 15 | 0 | 10 | Yes |
| 12 | Create repurposing plan | Repurposing | 45 | +1 | 11 | No |
| 13 | Review initial metrics | Analytics | 30 | +3 | 11 | Yes |
| 14 | Review 7-day performance | Analytics | 45 | +7 | 11 | Yes |

## 2. YouTube Short

| Seq | Task | Minutes | Offset |
|---:|---|---:|---:|
| 1 | Select angle | 20 | -3 |
| 2 | Draft hook and script | 30 | -2 |
| 3 | Record | 30 | -2 |
| 4 | Edit and caption | 60 | -1 |
| 5 | QA and upload | 30 | -1 |
| 6 | Publish | 10 | 0 |
| 7 | Review metrics | 20 | +3 |

## 3. Instagram Reel

| Seq | Task | Minutes | Offset |
|---:|---|---:|---:|
| 1 | Select concept | 20 | -3 |
| 2 | Write hook and outline | 25 | -2 |
| 3 | Record | 30 | -2 |
| 4 | Edit | 60 | -1 |
| 5 | Write caption and CTA | 20 | -1 |
| 6 | Publish | 10 | 0 |
| 7 | Community response | 20 | 0 |
| 8 | Review metrics | 20 | +3 |

## 4. LinkedIn Post

| Seq | Task | Minutes | Offset |
|---:|---|---:|---:|
| 1 | Select insight | 15 | -2 |
| 2 | Draft post | 35 | -1 |
| 3 | Edit hook and CTA | 20 | -1 |
| 4 | Final review | 10 | 0 |
| 5 | Publish | 10 | 0 |
| 6 | Respond to comments | 20 | 0 |
| 7 | Record metrics | 10 | +2 |

## 5. LinkedIn Carousel

| Seq | Task | Minutes | Offset |
|---:|---|---:|---:|
| 1 | Define lesson | 20 | -5 |
| 2 | Build slide outline | 45 | -4 |
| 3 | Draft slide copy | 60 | -3 |
| 4 | Design carousel | 120 | -2 |
| 5 | QA and revise | 30 | -1 |
| 6 | Write post caption | 25 | -1 |
| 7 | Publish | 10 | 0 |
| 8 | Review metrics | 20 | +3 |

## 6. Newsletter

| Seq | Task | Minutes | Offset |
|---:|---|---:|---:|
| 1 | Select topic and CTA | 20 | -4 |
| 2 | Build outline | 30 | -3 |
| 3 | Draft newsletter | 90 | -2 |
| 4 | Edit | 40 | -1 |
| 5 | Format and links QA | 30 | -1 |
| 6 | Send or schedule | 15 | 0 |
| 7 | Review open and click results | 20 | +3 |

## 7. Podcast Episode

| Seq | Task | Minutes | Offset |
|---:|---|---:|---:|
| 1 | Research topic or guest | 60 | -10 |
| 2 | Prepare outline/questions | 60 | -7 |
| 3 | Record | 120 | -5 |
| 4 | Edit audio/video | 180 | -3 |
| 5 | Write title and description | 45 | -2 |
| 6 | QA | 30 | -1 |
| 7 | Publish | 20 | 0 |
| 8 | Create clips | 120 | +1 |
| 9 | Review metrics | 30 | +7 |

## 8. Blog Article

| Seq | Task | Minutes | Offset |
|---:|---|---:|---:|
| 1 | Research keyword and intent | 60 | -7 |
| 2 | Outline | 45 | -6 |
| 3 | Draft | 180 | -4 |
| 4 | Edit and fact-check | 90 | -2 |
| 5 | Format and images | 60 | -1 |
| 6 | Publish | 20 | 0 |
| 7 | Repurpose | 60 | +1 |
| 8 | Review performance | 20 | +7 |

## 9. Repurposing mappings

### YouTube long-form may produce

- 2–5 Shorts
- 1 LinkedIn post
- 1 carousel
- 1 newsletter section
- 3 quote cards
- 1 poll
- 1 X thread

### Podcast may produce

- clips
- quote cards
- summary post
- newsletter
- blog article

### Newsletter may produce

- LinkedIn post
- carousel
- X thread
- short video

## 10. Workflow customization

Users may clone workflows and change:

- task names;
- durations;
- offsets;
- optionality;
- sequence;
- dependencies.

Default workflows must remain restorable.
