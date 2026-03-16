# Truligon Brand & Investor Article Guidelines

**How to keep investor-facing articles visually and tonally consistent with Truligon.**

---

## 1. Core Visual Identity

- **Color System (Jet Set Radio + Tron)**
  - **Primary Neon**
    - `tron-cyan` `#00F0FF` – core accent, glow, borders, metrics.
    - `tron-blue` `#0080FF` – secondary accent.
  - **JSR Palette**
    - `jsr-pink` `#FF00FF`
    - `jsr-blue` `#00FFFF`
    - `jsr-yellow` `#FFFF00`
    - `jsr-green` `#00FF00`
  - **Background**
    - `bg-primary` `#000000` – page background.
    - `bg-secondary` `#0A0A0A`
    - `bg-card` `#0F0F0F` – cards/panels.
  - **Text**
    - `text-primary` `#FFFFFF`
    - `text-secondary` `#CCCCCC`
    - `text-muted` `#888888`
    - `text-accent` = `tron-cyan`

- **Fonts**
  - **Title/Display**: `GeostarFill` (from `/font/GeostarFill-Regular.ttf`), fall back to system sans.
  - **Body**: System sans stack:
    - `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif`
  - **Code/Tech/IDs**: Mono stack:
    - `"Courier New", "Monaco", "Menlo", "Consolas", monospace`

- **Effects**
  - **Grid Overlay**: subtle cyan grid (`tron-grid`) with 20px spacing.
  - **Neon Glow**: soft cyan glow on key accents (buttons, important metrics).
  - **Cards**: dark card background, thin border, optional glow edge for “featured” callouts.

---

## 2. Layout Patterns for Investor Articles

Investor HTML templates live in `html-templates/`:

- **`INVESTOR-ARTICLE-BASE.html`**
  - Long-form structure for white-papers and deep dives.
  - Components:
    - **Pill Row**: `Exclusive Investor Access`, `Truligon • Private Briefing`, etc.
    - **Header**: eyebrow, large gradient title, subtitle, meta line.
    - **Accent Card**: “Why this briefing exists” with 2–3 key metrics.
    - **Body**: `h2`, `h3`, paragraphs, bulleted lists, `code-block`, and `callout`.
    - **Footer Tagline**: confidentiality line.

- **`INVESTOR-BRIEF-ONEPAGER.html`**
  - Compressed one-pager (fits roughly one screen on desktop).
  - Components:
    - **Pills** for labels.
    - **Header Row**: brief title + 3 compact metrics.
    - **Two Content Blocks**:
      - “What this is / Why it’s defensible”.
      - “Near-term path / milestones”.
    - **Footer Line**: private/investor-only.

**Rule of thumb**:
- Use **BASE** when you are:
  - Explaining architecture (Axerey, mythoGon, infrastructure).
  - Doing IP/white-paper style deep dives.
- Use **ONEPAGER** when you are:
  - Summarizing one tool, product, or launch.
  - Needing a fast, scannable investor snapshot.

---

## 3. Image & Logo Usage (Current Assets)

- **Truligon Logo**
  - Primary logo file (from main site landing):
    - `/sdfff/truligonLigo.png`
  - Usage in investor articles:
    - Optional small logo in the top-left or in the footer.
    - Keep it monochrome on dark background (no heavy glow on the logo itself).

- **Key Artwork (from `public/index.html`)**
  - Hero characters:
    - `/sdfff/485147642_629486983389813_550660112454166751_n.jpg`
  - Vision/feature artwork:
    - `/sdfff/488270069_643446101993901_6362341084983421068_n.jpg`
  - CTA/footer artwork:
    - `/sdfff/482122580_618590987812746_26349315292689359_n.jpg`
    - `/sdfff/483101968_624781090527069_3841797638238870577_n.jpg`

**Guidelines**:
- Use these images sparingly in investor HTML:
  - One hero image at the top or a small banner under the header card.
  - Do **not** clutter the page; investors should see text and structure first.
- Maintain aspect ratio, no distortion.
- Avoid heavy overlays that clash with neon grid; keep images inside cards or simple containers.

---

## 4. Tone & Voice (Investor-Facing)

- **Tone**
  - **Serious, technical, and focused** on IP and infrastructure.
  - No “building in public”, no community/fandom language.
  - Emphasize: *strategic disclosure*, *built systems*, *competitive edge*.

- **Voice**
  - First-person singular (“I”) is acceptable when Pedro/Axefield is speaking directly about the journey.
  - Switch to “we” when describing Truligon as an operating entity.
  - Avoid hype for hype’s sake; every strong claim should be tied to:
    - A concrete system.
    - A capability.
    - A near-term business or deployment path.

- **Framing**
  - IP is new and proprietary (no “just another AI tool” framing).
  - AI is a **tool** used to build the stack, not the product itself.
  - mythoGon = **soul / agency layer**.
  - Axerey = **memory / reasoning / adaptive learning layer**.

---

## 5. When Converting Markdown → HTML

- **Headings**
  - Top-level sections → `<h2>` within `.article-body`.
  - Subsections → `<h3>`.

- **Lists**
  - Use `<ul>`/`<li>` for bullets, inside `.article-body`.
  - For checklists or milestones on one-pagers, consider `<ul>` in the side block.

- **Callouts**
  - Wrap “why this matters / investor note” paragraphs in:

    ```html
    <div class="callout">
      <strong>Investor Note:</strong> …
    </div>
    ```

- **Code / Structures**
  - Use the `.code-block` style for pseudo-code or structural examples:

    ```html
    <pre class="code-block"><code>…</code></pre>
    ```

---

## 6. Confidentiality Footers

Every investor-facing article template should end with one of:

- **Standard**:
  > Truligon • Strategic Disclosure Only • Do Not Circulate Publicly

- **Short Form (one-pager)**:
  > Truligon • Private Investor Material • Not For Public Distribution

Keep this line visible and unambiguous on every exported HTML article.  
This reinforces the “private investor Substack” framing across all content.


