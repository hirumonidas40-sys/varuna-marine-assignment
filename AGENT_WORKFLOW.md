# AGENT_WORKFLOW.md

# AI Agent Workflow Log

## Agents Used

* **GitHub Copilot (VS Code)** — inline completions for boilerplate and TS signatures.
* **ChatGPT / GPT-4.1** — design decisions, architecture explanation, prompt engineering and validation assistance.
* **Claude (Anthropic)** — refactoring suggestions and long-form reasoning about domain model boundaries.
* **Cursor Agent** — task-driven code generation for isolated features (`tasks.md` approach).
* **Unit Test Generator (AI)** — small specialized agent used to propose unit tests and edge-cases.

> Note: agent names above reflect commonly available tools; replace with your organization’s actual agents if different.

## Prompts & Outputs

### Example 1: Initial domain model generation (exact prompt)

```
Prompt: "Design TypeScript domain models for a Fuel EU Compliance module. Entities: Route, Vessel, ComplianceBalance (CB), Pool, BankingOperation. Include fields and basic validation rules. Output TypeScript interfaces only."
```

**Generated snippet (as returned by agent):**

```ts
export interface Route {
  routeId: string;
  vesselId: string;
  vesselType: 'tanker' | 'bulk' | 'container' | 'other';
  fuelType: 'HFO' | 'MGO' | 'LNG' | 'bio' | 'hybrid';
  year: number;
  ghgIntensity: number; // gCO2e/MJ
  fuelConsumptionTons: number;
  distanceKm: number;
  totalEmissionsTons: number;
}

export interface ComplianceBalance {
  shipId: string;
  year: number;
  cbBefore: number; // tCO2e or equivalent units used in module
  applied: number;
  cbAfter: number;
}
```

### Example 2: Refinement prompt & corrected output (exact prompt)

```
Prompt: "Refine the Route model to include computed fields and a method signature for `recalculateTotals()` that enforces ghgIntensity >= 0 and positive distance/fuelConsumption. Output a TypeScript class with JSDoc only.
```

**Generated snippet (initial agent output):**

```ts
export class Route {
  constructor(public data: RouteDTO) {}
  recalculateTotals() {
    this.totalEmissionsTons = this.ghgIntensity * this.fuelConsumptionTons; // WRONG units
  }
}
```

**Correction (human edit):**

* Noted that `ghgIntensity` is gCO2e/MJ and `fuelConsumption` is in tonnes; direct multiply is unit-mismatched. We requested the agent to produce corrected formula using energy density conversion or to store `fuelEnergyMJ`.

**Final corrected code (used in repo):**

```ts
/**
 * Route domain entity with energy-aware calculations
 */
export class RouteEntity {
  routeId: string;
  vesselId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number; // gCO2e / MJ
  fuelConsumptionTons: number; // metric tons
  distanceKm: number;
  totalEmissionsTons: number; // computed

  // energy density mapping (MJ per ton) for common fuels
  private static energyDensityMJPerTon: Record<string, number> = {
    HFO: 41600,
    MGO: 42000,
    LNG: 50000,
    bio: 40000,
    hybrid: 41000,
  };

  constructor(init: Partial<RouteEntity>) {
    Object.assign(this, init);
    this.validate();
    this.recalculateTotals();
  }

  validate() {
    if (this.ghgIntensity < 0) throw new Error('ghgIntensity must be >= 0');
    if (this.distanceKm <= 0) throw new Error('distanceKm must be > 0');
    if (this.fuelConsumptionTons < 0) throw new Error('fuelConsumptionTons cannot be negative');
  }

  recalculateTotals() {
    const energyDensity = RouteEntity.energyDensityMJPerTon[this.fuelType] ?? 41000;
    // gCO2e = ghgIntensity (g/MJ) * energy (MJ); convert g to tons (1 ton = 1e6 g)
    const totalGg = (this.ghgIntensity * (this.fuelConsumptionTons * energyDensity));
    this.totalEmissionsTons = totalGg / 1_000_000;
  }
}
```

## Validation / Corrections

* **Unit correctness:** Agents often omitted unit conversions (common hallucination). We validated formulas by creating small Python/TypeScript unit tests verifying sample inputs and expected output (e.g., 1 ton fuel with 42000 MJ/ton and 100 g/MJ yields 4,200,000 g = 4.2 t CO2e).
* **Type and runtime checks:** Copilot often produced interfaces without runtime validation. We used a Claude prompt to suggest guard implementations and then wrote manual tests.
* **Edge cases:** Agents missed negative/zero checks; we added them in `validate()` and included tests to ensure defenses.

## Observations

* **Where agents saved time:**

  * Bootstrapping model interfaces, DTO shapes, and controller skeletons.
  * Generating repetitive wiring: repository interfaces, mapper functions, and test templates.
* **Where they failed / hallucinated:**

  * Domain-specific physical unit conversions (energy densities, units) were often incorrect or omitted.
  * Misunderstood business rules around Banking/Pooling constraints; we had to restate rules precisely and iterate.
* **How we combined tools:**

  * Used Copilot for quick inline completions and small helper functions.
  * Used Claude for architectural refactor suggestions across modules (e.g., moving business logic from adapters to application layer).
  * Used Cursor Agent for task-oriented generation when creating a new adapter (it produced a `tasks.md` + initial code which we then reviewed).

## Best Practices Followed

* Kept prompts small, focused, and with explicit constraints (units, validation, return types).
* Used AI for generation + human review for domain correctness / safety.
* Created unit tests for any agent-generated computation to catch unit mistakes early.
* Versioned generated outputs in a dedicated branch before merging.

---
