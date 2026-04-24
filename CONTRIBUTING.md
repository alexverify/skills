# Contributing to Venice Skills

Thanks for helping make the Venice skill catalog more useful. These guidelines keep every `SKILL.md` consistent and maximally useful for an autonomous agent.

## Repo layout

```
skills/<skill-name>/SKILL.md    One skill per folder
template/SKILL.md               Starting point for new skills
```

Supporting files (helper scripts, reference data) can live alongside `SKILL.md` inside the skill folder and be referenced relative to it.

## Skill types

This repo contains two types of skills:

### API Documentation Skills (`venice-*`)

Skills that teach agents how to use specific Venice API endpoints. These follow a strict template.

### Generator / Scaffolding Skills (`create-*`)

Skills that help agents create new projects using Venice AI. These include sample code, references, and interactive checklists. They follow a more flexible structure but must still have concrete frontmatter descriptions.

## Style for API Documentation Skills

- **Scope one surface area** — each skill covers a coherent slice of the Venice API (e.g. `venice-embeddings`, not `venice-embeddings-and-chat`). If two skills keep cross-referencing each other, either merge them or tighten their boundaries.
- **Concrete frontmatter `description`** — the agent uses this to decide when to load. Name the specific endpoints, parameters, and scenarios. Vague descriptions ("things about chat") hurt selection.
- **Endpoint tables first** — a table of methods + paths + one-line notes at the top of the skill.
- **Examples** — at least one `curl` and one SDK / fetch example per endpoint.
- **Errors and gotchas** — finish every skill with a table of likely failure modes and a "Gotchas" section of non-obvious edge cases.
- **Cross-links** — reference related skills with relative paths (`../venice-errors/SKILL.md`).
- **Length** — aim for under 500 lines. Longer skills should be split.

## Style for Generator Skills

- **Concrete frontmatter `description`** — describe when an agent should use this skill (e.g., "when building an agent TUI", "when scaffolding a new project").
- **Interactive checklists** — present options as multi-select checklists with sensible defaults.
- **Working sample code** — include a complete, runnable sample in a `sample/` directory.
- **References** — put detailed specs in a `references/` directory to keep the main SKILL.md focused.
- **Generation workflow** — clearly document the steps an agent should follow.

## Authoring a new skill

1. Copy `template/` to `skills/<your-skill-name>/`.
2. Pick a `name` — `venice-<area>[-<subarea>]` (lowercase, hyphens).
3. Fill in the frontmatter `description` before writing the body; it forces you to clarify scope.
4. Write the body, derive everything from `swagger.yaml` / docs.
5. Add your skill to the catalog table in the root `README.md`.
6. Open a PR.

## Updating existing skills

- When `swagger.yaml` changes, update every affected skill in the same PR.
- Bump the version tag if the change breaks existing agent behavior (e.g. renamed parameter).
- Keep examples in sync with the current spec.

## Review checklist

### For API Documentation Skills

- [ ] Frontmatter `name` + `description` present and concrete.
- [ ] Endpoint table at the top.
- [ ] At least one `curl` example.
- [ ] Errors + gotchas section.
- [ ] Cross-links to related skills.
- [ ] Added to root `README.md` catalog if new.
- [ ] No secrets or real API keys in examples (use `$VENICE_API_KEY`).

### For Generator Skills

- [ ] Frontmatter `name` + `description` present and concrete.
- [ ] Interactive checklist with defaults marked.
- [ ] Working sample code in `sample/` that compiles/runs.
- [ ] Clear generation workflow documented.
- [ ] Added to root `README.md` catalog if new.
- [ ] No secrets or real API keys in examples (use `$VENICE_API_KEY`).
