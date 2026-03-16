# Truligon Investor Substack – Implementation Checklist

**How to go from strategy docs → HTML investor pages using Truligon-branded templates.**

---

## 1. Choose Article Type & Template

- **Decide the format:**
  - **Deep dive / white paper / long narrative**
    - Use: `html-templates/INVESTOR-ARTICLE-BASE.html`
  - **Short summary / 1-screen brief / quick update**
    - Use: `html-templates/INVESTOR-BRIEF-ONEPAGER.html`

- **Map content source:**
  - From:
    - `WHITE-PAPER-AXEREY-MYTHOGON.md`
    - Example articles in `examples/`
    - Strategy docs (`00-STRATEGY-OVERVIEW.md`, etc.)
  - To:
    - The `<article>` body in the chosen HTML template.

---

## 2. Prepare Content (Markdown → Structured Sections)

- **Step 2.1 – Identify sections**
  - Mark the main headings you want:
    - Problem / Context
    - Solution / Architecture
    - IP & Competitive Edge
    - Roadmap / Next Steps

- **Step 2.2 – Normalize headings**
  - Use `##` in Markdown for sections that will become `<h2>`.
  - Use `###` for subsections that will become `<h3>`.

- **Step 2.3 – Highlight investor notes**
  - Wrap any “why this matters for investors” text in a callout when transferring to HTML:

    ```html
    <div class="callout">
      <strong>Investor Note:</strong> …
    </div>
    ```

---

## 3. Fill the HTML Template

- **Step 3.1 – Header block**
  - Update:
    - `[Replace With Article Title]`
    - Subtitle line (1–2 sentences in investor language).
    - Meta fields:
      - Date
      - Author
      - Program (Axerey, mythoGon, Truligon infra, etc.)

- **Step 3.2 – Highlight card / metrics**
  - In `INVESTOR-ARTICLE-BASE.html`:
    - Fill the “Why This Briefing Exists” card with:
      - 2–3 sentences summarizing the investor case.
    - Set metric values (e.g., IP layer, launch horizon).
  - In `INVESTOR-BRIEF-ONEPAGER.html`:
    - Fill 3 key metrics for domain, stage, and core edge.

- **Step 3.3 – Main body**
  - Replace the placeholder `<h2>`, `<h3>`, `<p>`, `<ul>` content with:
    - Cleaned, sectioned content from your Markdown files.
  - Use `.code-block` for any structural snippets or pseudo-code.

---

## 4. Integrate With Substack (or Other Platform)

- **Step 4.1 – Create a new post**
  - In Substack:
    - Start a new post.
    - Switch to the HTML/code mode (or “edit HTML” view, depending on UI).

- **Step 4.2 – Paste HTML**
  - Paste the entire contents of the chosen template file:
    - `INVESTOR-ARTICLE-BASE.html` **or**
    - `INVESTOR-BRIEF-ONEPAGER.html`
  - Ensure inline `<style>` remains at the top of the `<head>` section so the article carries Truligon’s look without external CSS.

- **Step 4.3 – Verify rendering**
  - Preview the post:
    - Check background grid, neon accents, and card styles.
    - Confirm typography and spacing look readable on:
      - Desktop
      - Mobile

---

## 5. Optional: Hosting As Static Investor Pages on Truligon

- **Step 5.1 – Create static file**
  - Place finalized HTML file under a new investor-only path in the `truligon` app (e.g., `public/investor/briefings/<slug>.html`).

- **Step 5.2 – Wire route (if needed)**
  - Use the existing static serving in the Truligon server to expose that path behind:
    - Your investor login / session system
    - Or a private link (`/investor/private/<slug>`)

---

## 6. Final QA Before Sending to Investors

- **Checklist**
  - [ ] Title and subtitle are in investor language (no “building in public”).
  - [ ] IP and competitive edge are clearly stated in the first card/body section.
  - [ ] Sections are short, scannable, and follow the abstraction guidelines.
  - [ ] Confidentiality footer is present:
    - Base template: “Strategic Disclosure Only • Do Not Circulate Publicly”
    - One-pager: “Private Investor Material • Not For Public Distribution”
  - [ ] No placeholder text remains.
  - [ ] Links (if any) point to correct Truligon resources or investor-only materials.

Once this checklist passes, the article is ready to be:
- Published on the private investor Substack, **or**
- Deployed as a static investor briefing page on `truligon.com`.


