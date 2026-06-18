# i18n native-review checklists

Machine-translation first pass for commons-hub.at. Each language has a checklist;
correct strings in the source files and re-run a build. UI strings live in
`messages/<lang>.json`; content in `content/snapshot/<lang>/*.json`.

| Language | To review | Unchanged (verify) | Long-form (EN) |
|---|---:|---:|---:|
| [German](de.md) | 164 | 8 | 38 |
| [Hungarian](hu.md) | 166 | 6 | 38 |
| [Czech](cs.md) | 164 | 8 | 38 |
| [Slovak](sk.md) | 165 | 7 | 38 |

**How to review:** open a language file, work top to bottom, tick each box once a
native speaker confirms/corrects the text in the source file. Section 1 is MT to
check; section 2 is strings still in English (skipped or proper nouns); section 3
is long-form bodies needing human translation.
