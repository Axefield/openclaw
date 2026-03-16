# Truligon Persona & Argument Strategy

**Purpose:**  
Map out who we’re talking to (personas), what actually makes Truligon interesting to them, and which arguments we use at different depth levels (one-pagers vs. tier‑2 investor content). This is about the **game engine + systems IP first**, with AI tools as supporting context, not the main pitch.

---

## 1. Audience Lanes & Depth Levels

- **Depth Levels**
  - **Tier 0 – Glance (30–60s)**: taglines, 1–2 core claims.
  - **Tier 1 – One-Pager (2–5 min)**: simple structure, clear hooks, minimal tech.
  - **Tier 2 – Deep Investor / Client Read (10–20 min)**: systems, architecture, roadmap, risk.

- **Personas**
  - **P1 – Financial Investor (Macro / IP Portfolio)**
  - **P2 – Technical Investor (Product / Systems)**
  - **P3 – Ethics / Systems Investor (Dystopia-aware)**
  - **P4 – Client CTO / Head of Product (B2B, engines & APIs)**
  - **P5 – Client Innovation / Strategy (Training, simulations, serious games)**
  - **P6 – Player / Gamer (Public)**
  - **P7 – Citizen / Dystopia-Aware Reader (Public)**  

For each persona below:
- **Core claim**: what we’re really saying to them.
- **Why it’s interesting**: their “hook”.
- **Evidence**: what we can point to today (game engine, systems, repos, infra).
- **Objections / steelman**: strongest fair pushbacks.
- **Response pattern**: how we answer without bullshit.
  
This file will feed the actual **HTML templates and one-pagers** later.

---

## 2. Persona: P1 – Financial Investor (Macro / IP Portfolio)

### 2.1 Profile
- Cares about: upside, IP defensibility, timing, founder execution.
- Not deeply technical, but can follow system-level thinking if framed cleanly.

### 2.2 Core Claim
> Truligon is an already-running stack of simulation engines and infrastructure that can cheaply back **multiple games and training products**—creating a reusable systems IP portfolio with real code and infra in place today, and clear paths to monetization.

### 2.3 Why It’s Interesting to Them (Fundable Premises)
- **Premise 1 – Existing Running Stack, Not a Deck**
  - Completed and running infra (`truligon` server + accounting + multi-app platform + Cloudflare tunnel + email).
  - Multiple built games (Semisweet Jacket, NeoCheyenne, Semigon core) already sitting on that infra.
- **Premise 2 – Reusable Simulation Engines**
  - NeoCheyenne’s economic/housing engine (wealth tiers, infra dependencies, commodities) can be repackaged beyond the current game.
  - Semisweet Jacket’s control/surveillance “reality-systems” core can power other scenarios (training, analytics, serious games).
- **Premise 3 – Option Value Across Products**
  - Same engines + infra can back:
    - Consumer games (premium / live service).
    - B2B simulation/training products (API or module form).
  - New projects are cheaper and faster because the core systems are already built.
- **Premise 4 – IP Cluster Around a Technical Core**
  - Vertical: strongly-typed game/simulation engines and infra.
  - Horizontal: music catalog, story, film potential, and tooling anchored to the same universe.

### 2.4 Evidence We Can Use
- `truligon` infra: accounting system, multi-app platform, Cloudflare tunnel, email infra.
- `NeoCheyene` (economic survival sim) and `semisweetjacket` (control/surveillance game).
- `Semigon` (Truligon RPG core) and screenplay / lore docs.
- MUSIC-CATALOG.md: music as IP assets.

### 2.5 Likely Objections (Steelman)
- “This looks like a **solo dev vision project**, not a company.”
- “Dystopian critique doesn’t always translate into returns.”
- “Simulation engines are niche; where’s the clear monetization?”

### 2.6 Response Pattern
- Admit this started as **one person**, but show:
  - Breadth **and** depth of systems built since 2023.
  - The infra + accounting + multi-subdomain stack = readiness for more people.
- Frame monetization as:
  - Games (premium / live service).
  - Engines/APIs for simulation, training, and serious applications over time.
- Emphasize **optionality**:
  - This portfolio can become: games, tools, media, or a mix, without rewriting the core systems.

### 2.7 Content Strategy
- **Tier 1:** One-pager: *“Truligon as a Systems IP Portfolio”* (INVESTOR-BRIEF-ONEPAGER).
- **Tier 2:** Long article: *“From Dystopia to Engine: The Truligon Stack”* (INVESTOR-ARTICLE-BASE).

---

## 3. Persona: P2 – Technical Investor (Product / Systems)

### 3.1 Profile
- Likely to ask about: architectures, tradeoffs, codebases, reproducibility.
- Comfortable with words like **simulation**, **engine**, **infra**, **APIs**.

### 3.2 Core Claim
> Truligon is a collection of **concrete, running systems**—game engines, a self-hosted multi-app platform, and accounting/infra—that model real-world injustice as code, not theme. AI tools accelerate development, but the product is the systems themselves.

### 3.3 Why It’s Interesting to Them
- They see:
  - A working **multi-subdomain platform** with accounting and auth.
  - **Game engines** built with TypeScript/Three.js and strong typing.
  - The possibility of packaging simulation kernels as services.
- It’s **hard tech with a story**, not story pretending to be tech.

### 3.4 Evidence We Can Use
- `truligon` repo: server, accounting system, subdomain apps guide, upgrades doc.
- `NeoCheyene`: wealth-based pricing, housing/infrastructure dependencies, commodities.
- `semisweetjacket`: reality-systems core, audio systems, ECS, test suite.
- `Semigon`: 52-card time and zone mapping.

### 3.5 Likely Objections (Steelman)
- “Where is the **separation** between engine and one-off game logic?”
- “How reusable are these systems as products, not just neat prototypes?”
- “Is the infra overbuilt relative to current userbase?”

### 3.6 Response Pattern
- Show specific **engine boundaries**:
  - `reality-systems.ts`, `EconomicSimulation`, `WealthBasedPricingManager`, etc.
- Make a roadmap:
  - Step from **bespoke game** → **configurable engine** → **API/service**.
- Clarify AI tools:
  - Used to reach 200x productivity, but not sold as the product.

### 3.7 Content Strategy
- **Tier 1:** One-pager: *“Truligon for Technical Investors: Engines, Not Just Vibes.”*
- **Tier 2:** Deep-dive HTML: infrastructure showcase + engine breakdowns.

---

## 4. Persona: P3 – Ethics / Systems Investor (Dystopia-Aware)

### 4.1 Profile
- Already convinced the world is dystopian in practice.
- Cares about: how tech frames power, ethics, and agency.

### 4.2 Core Claim
> Truligon doesn’t sanitize or glamorize dystopia; it **models it honestly** and then experiments with how agents might act ethically inside it, with mythoGon as a future ethics/soul layer—not yet wired in, but clearly designed.

### 4.3 Why It’s Interesting to Them
- They’re tired of:
  - “Tech saves the world” theater.
  - Token ethics decks.
- They want systems that **admit the world is rigged** and then:
  - Allow people and AI to explore it explicitly.
  - Eventually layer ethics on top (mythoGon).

### 4.4 Evidence We Can Use
- `Colonial Extraction 2025` themes (dead internet, healthcare, Puerto Rico, etc.).
- NeoCheyenne and Semisweet Jacket mapping real suffering into mechanics.
- mythoGon white paper + docs (as concept + code, not yet integrated).

### 4.5 Likely Objections (Steelman)
- “Is this just cynicism in engine form?”
- “Does adding an ethics/soul engine change anything structurally, or is it narrative dressing?”

### 4.6 Response Pattern
- Explain that step one is **accurate modeling of harm**; step two is:
  - Experiments with constraints/value-weighted decision-making (mythoGon).
- Emphasize: mythoGon is **not integrated yet**; honesty about phase.
- Position the project as:
  - A sandbox for “how do we get away from bullshit?” not “everything is fine.”

### 4.7 Content Strategy
- **Tier 1:** One-pager: *“Rigged Worlds, Honest Systems.”*
- **Tier 2:** Deep article: *“Ethics After Extraction: Truligon, mythoGon, and No-Bullshit Systems.”*

---

## 5. Persona: P4 – Client CTO / Head of Product (Engines & APIs)

### 5.1 Profile
- Could license engines, simulations, or infra as part of their stack.
- Cares about: stability, clarity of API surface, maintenance cost.

### 5.2 Core Claim
> Under the Truligon IP there are **rich, strongly-typed simulation engines** for economics, housing, surveillance, control, and game-state that can be exposed as APIs or modules—for training, analytics, and serious game applications.

### 5.3 Why It’s Interesting to Them
- They can:
  - Avoid reinventing complex simulation internals.
  - Use pre-built dynamics to model scenarios relevant to their domain.

### 5.4 Evidence We Can Use
- `NeoCheyene` economic sim core: pricing, wealth tiers, infrastructure dependencies.
- `semisweetjacket` reality-systems core.
- Strong TypeScript typing in engines (no `any` policy in core logic).

### 5.5 Likely Objections (Steelman)
- “We don’t want to depend on a single developer’s engine.”
- “How do we integrate this cleanly with our tech stack?”

### 5.6 Response Pattern
- Show:
  - Clear module boundaries and good typing.
  - Possible packaging paths: separate NPM libs, microservice APIs.
- Admit that current maturity is **engines first, productization second**; invite co-design with early clients.

### 5.7 Content Strategy
- **Tier 1:** One-pager: *“Simulation Engines from Truligon: NeoCheyenne & Semisweet Cores.”*
- **Tier 2:** Technical brief: API surfaces, example integration flows.

---

## 6. Persona: P5 – Client Innovation / Strategy (Training & Serious Games)

### 6.1 Profile
- Think: innovation teams, labs, training orgs, think-tanks.
- Want experiential ways to explore complex systems: housing, economics, control.

### 6.2 Core Claim
> Truligon’s games double as **training environments and thought experiments** for living under extraction—ideal for workshops, simulations, and scenario design.

### 6.3 Why It’s Interesting to Them
- They get:
  - High-fidelity but stylized systems they can drop people into.
  - A way to talk about systemic harm without abstract slides.

### 6.4 Evidence / Objection / Response
- Evidence:
  - Victory/defeat conditions in NeoCheyenne and Semisweet Jacket.
  - How player actions map to economic or control outcomes.
- Objections:
  - “Is this too dark for corporate environments?”
- Response:
  - Tone can be tuned by scenario selection; engines are modular.

### 6.5 Content Strategy
- Tiered briefs describing **use-cases**:
  - Training scenario sets grounded in existing games.

---

## 7. Persona: P6 – Player / Gamer (Public)

### 7.1 Core Claim
> These are games about **surviving systems that already feel rigged**—economic survival in NeoCheyenne, surveillance/stability in Semisweet Jacket, fractured time and identity in Truligon.

### 7.2 Why It’s Interesting
- Instead of power fantasy, they get:
  - Insight into real dynamics they already feel in life.
  - Aesthetic and sonic coherence (music catalog, PHUTURE_SICK_PHONK).

### 7.3 Content Strategy
- Public-facing pages and trailers that:
  - Emphasize feel and experience.
  - Hint at depth without investor jargon.

---

## 8. Persona: P7 – Citizen / Dystopia-Aware Reader (Public)

### 8.1 Core Claim
> Truligon is what happens when you take the **dead internet**, privatized essentials, colonial extraction, and “murder system” healthcare, and refuse to look away—then encode that feeling into games, music, and story instead of essays alone.

### 8.2 Why It’s Interesting
- They’re already living the mood; this gives:
  - Language, symbols, and worlds for it.
  - A way to see through some of the facades.

### 8.3 Content Strategy
- Manifesto-style public content:
  - “Colonial Extraction 2025”
  - Story overviews
  - Connections to NeoCheyenne and Semisweet Jacket.

---

## 9. Next Steps (for Content Creation)

1. **Lock Persona Hooks**
   - Confirm you’re happy with these core claims and “why it’s interesting” for each persona.

2. **Generate Argument Skeletons per Persona**
   - For P1–P5, construct explicit argument frameworks:
     - Claim → Premises → Evidence → Objections (steelman) → Responses.
   - Store those patterns so tier-1 and tier-2 content stays consistent.

3. **Map to Templates**
   - For each persona and tier, map:
     - Which HTML template (`INVESTOR-ARTICLE-BASE.html`, `INVESTOR-BRIEF-ONEPAGER.html`, or public page) we’ll use.

4. **Write Actual Pieces**
   - Start with:
     - P1 Tier‑1 (investor one-pager).
     - P1/P2 Tier‑2 (deep investor read).
   - Then expand to client and public lanes.


