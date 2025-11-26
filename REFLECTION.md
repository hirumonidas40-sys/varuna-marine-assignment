## Reflection — Using AI Agents (one-page)

Working with AI agents while building the Fuel EU compliance module was a pragmatic experience: agents accelerated scaffolding and repetitive code generation, but human domain knowledge was essential to validate physics, units, and legal/business rules.

**Key learnings**

* Use agents for *boilerplate*, not for critical domain rules. Always write unit tests for generated computations.
* Keep prompts narrowly scoped (single function / single behavior) to reduce hallucinations.
* Combine agents: one for code generation, another for refactor reasoning, and a third for test generation.

**Efficiency gains**

* Time saved: ~30-40% on scaffolding and CRUD wiring.
* Time spent verifying: ~20% on unit tests and domain validation.

**Improvements for next time**

* Define a `tasks.md` for Cursor from day 1 to create more deterministic task outputs.
* Use smaller PRs with generated code and automated test gates before merging.
* Add a dataset of canonical energy densities and unit tests for all physics conversions.

---

# Appendix: Suggested repository file tree (minimal)

```
repo-root/
├─ backend/
│  ├─ src/
│  │  ├─ core/
│  │  │  ├─ domain/
│  │  │  ├─ application/
│  │  │  └─ ports/
│  │  ├─ adapters/
│  │  │  ├─ infrastructure/
│  │  │  └─ http/
│  │  └─ shared/
│  ├─ package.json
│  └─ prisma/
├─ frontend/
│  ├─ src/
│  │  ├─ core/
│  │  │  ├─ domain/
│  │  │  ├─ application/
│  │  │  └─ ports/
│  │  ├─ adapters/
│  │  │  ├─ ui/
│  │  │  └─ infrastructure/
│  │  └─ shared/
│  ├─ package.json
├─ AGENT_WORKFLOW.md
├─ README.md
└─ REFLECTION.md
```

---
