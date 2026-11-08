# 🧠 Project Agent Skills Registry: AKG ALGO

> **Scope:** Guidelines for AI agents working on the AKG ALGO project repository (`/home/arch/project/agk_algo_git/agk_algo`).  
> **Source Packages:** `Leonxlnx/taste-skill`, `nateherkai/scroll-craft`, `blader/humanizer`, `addyosmani/agent-skills`, `microsoft/playwright-cli`, `alirezarezvani/claude-skills`, `emilkowalski/skills`.

---

## 1. Overview & Directive

All coding agents working on this codebase must consult and invoke the installed skills matching their current task. Never guess UI layouts, invent animation physics, or write robotic AI copy when a battle-tested skill exists for that domain.

### Quick Routing Table

| Task / Domain | Primary Skill(s) | Trigger / When to Use |
| :--- | :--- | :--- |
| **Frontend Taste & Anti-Slop** | `design-taste-frontend`, `unslop` | Whenever building, styling, or reviewing landing pages, hero sections, cards, or dashboards to avoid generic "AI-generated" looks. |
| **Scroll Experiences & Heroes** | `scroll-craft` | Designing layered dimensional heroes, scrollytelling, visitor journeys, or interactive landing pages. |
| **Copywriting & Voice** | `humanizer` | Writing or editing headings, feature blurbs, FAQs, onboarding text, or release notes to remove AI tells. |
| **Micro-Interactions & Motion** | `animate`, `emil-design-eng`, `choreograph`, `improve-animations` | Implementing toasts, modal entrances, tab switches, hover transitions, and spring physics. |
| **Motion Performance** | `animation-performance` | Ensuring smooth 60fps/120fps animations, eliminating layout thrashing (`transform`/`opacity` only). |
| **Testing & Browser Audits** | `playwright-cli`, `browser-testing-with-devtools`, `playwright-triage` | Taking headless screenshots, testing responsive viewports, validating forms, and inspecting console errors. |
| **Frontend Architecture** | `frontend-ui-engineering`, `code-simplification` | Structuring React components, managing state, refactoring bloated components, and ensuring accessibility. |
| **Performance & Bundle Sizing** | `performance-optimization` | Optimizing Core Web Vitals, reducing Vite bundle size, optimizing images, and preventing re-renders. |
| **Robustness & Error Recovery**| `debugging-and-error-recovery`, `security-and-hardening` | Diagnosing elusive bugs, sanitizing inputs, validating permissions, and hardening server hooks. |

---

## 2. Skill Catalog & Usage Rules

### 🎨 A. Design Taste & Anti-Slop (`design-taste-frontend`)
* **Origin:** `Leonxlnx/taste-skill`
* **Path:** `.agents/skills/design-taste-frontend/SKILL.md` (and globally at `~/.agents/skills/design-taste-frontend/SKILL.md`)
* **Purpose:** Anti-slop frontend engineering. Builds distinctive websites at the level of Figma and x.ai.
* **When to Use:**
  - Redesigning, restyling, or reviewing public landing pages, pricing cards, or admin portals.
  - When any UI element looks like a default template, lacks depth, or shows typical AI tells (purple gradients, glossy blobs, floating emoji badges).
* **Rules to Follow:**
  - **Single Design System:** Stick strictly to established palette tokens (`bg-akg-bg`, `text-akg-text`, `emerald`, `cyan`, `slate`).
  - **Real Product UI:** Show authentic UI cards, real statistics, and tangible data rather than placeholder abstract illustrations.
  - **High-Taste Typography:** Use Plus Jakarta Sans for confident headings, Inter for clean body copy, JetBrains Mono for data points.
  - **Equal Edges & Restraint:** Maintain consistent padding, clear hierarchy, and generous breathing room.

---

### 📜 B. Scroll Craft & Layered Heroes (`scroll-craft`)
* **Origin:** `nateherkai/scroll-craft`
* **Path:** `.agents/skills/scroll-craft/SKILL.md` (and globally at `~/.agents/skills/scroll-craft/SKILL.md`)
* **Purpose:** Crafting dimensional, scroll-driven visual narratives and premium hero experiences.
* **When to Use:**
  - Building or refining hero sections with background blueprint grids, cursor lighting, or layered cards.
  - Designing visual journeys such as "How it works in 3 steps" or interactive product breakdowns.
* **Rules to Follow:**
  - **Independent Visual Planes:** Ensure foreground UI cards, midground typography, and background grids move with distinct parallax or scroll weight.
  - **Mobile Composition:** Never rely solely on desktop scroll effects; provide dedicated, responsive static fallbacks for mobile viewports.
  - **Respect User Preferences:** Always support `prefers-reduced-motion` using motion hooks.

---

### ✍️ C. Humanizer: Natural Copywriting (`humanizer`)
* **Origin:** `blader/humanizer`
* **Path:** `.agents/skills/humanizer/SKILL.md` (and globally at `~/.agents/skills/humanizer/SKILL.md`)
* **Purpose:** Stripping artificial and robotic phrasing from user-facing copy.
* **When to Use:**
  - Drafting or editing landing page headlines, feature explanations, modal descriptions, and error notifications.
* **Rules to Follow:**
  - **Remove AI Tells:** Eliminate forced triads ("Fast, secure, and reliable"), stock clichés ("testament to", "delve into", "pivotal role"), and dramatic one-line closers.
  - **No Em-Dashes:** Per repository rules, never use em-dashes in code or copy; use commas, periods, or standard hyphens.
  - **Authentic Voice:** Speak directly, plainly, and technically like an experienced institutional desk operator.

---

### ✨ D. Micro-Interactions & Animation Suite (`emilkowalski/skills`)
* **Origin:** `emilkowalski/skills`
* **Installed Skills:**
  - `animate`: Fluid React/Framer Motion animation patterns.
  - `emil-design-eng`: Crafting tactile, responsive micro-interactions (press effects, hover states).
  - `choreograph`: Coordinated scene entrances and staggered list animations.
  - `animation-performance`: GPU compositing hygiene and zero layout thrashing.
  - `improve-animations`: Refining clunky transitions into smooth spring curves.
* **When to Use:**
  - Implementing transitions for modal drawers, toast notifications, tab panels, and expandable table rows.
* **Rules to Follow:**
  - **Hardware Acceleration:** Only animate `transform` and `opacity`. Never animate `width`, `height`, `top`, or `margin`.
  - **Natural Spring Curves:** Avoid linear transitions; use natural easing like `cubic-bezier(0.16, 1, 0.3, 1)` or standard spring physics.
  - **Quick Feedback:** Interaction feedback (button presses, hover sheens) should be snappy (150ms to 200ms), not sluggish.

---

### 🧪 E. End-to-End Browser Testing & Audits (`microsoft/playwright-cli` & `addyosmani/agent-skills`)
* **Origin:** `microsoft/playwright-cli` and `addyosmani/agent-skills`
* **Installed Skills:**
  - `playwright-cli`: Direct browser automation and visual capture.
  - `browser-testing-with-devtools`: Headless Chrome DevTools Protocol (CDP) inspections.
  - `playwright-triage`: Debugging rendering, hydration, and event timing glitches.
* **When to Use:**
  - Verifying UI changes in both Light and Dark modes.
  - Checking that no invisible or white-on-white text exists in any viewport.
  - Confirming forms, auth states, and checkout flows work without console exceptions.
* **Rules to Follow:**
  - **Capture Visual Proof:** Always take screenshots of modified views in both theme variants before marking a UI task done.
  - **Inspect Console Errors:** Ensure zero uncaught JavaScript errors or network failures exist during page loads.

---

### ⚙️ F. Engineering Discipline & Architecture (`addyosmani/agent-skills`)
* **Origin:** `addyosmani/agent-skills`
* **Installed Skills:**
  - `frontend-ui-engineering`: Clean component hierarchies, state isolation, and Tailwind token usage.
  - `performance-optimization`: Keeping Vite bundles lean and optimizing rendering loops.
  - `code-simplification`: Removing dead code, duplicate helpers, and unnecessary abstractions.
  - `debugging-and-error-recovery`: Root-cause diagnosis and resilient fallback states.
  - `security-and-hardening`: Server-side authorization checks and input sanitation in PocketBase hooks.
* **When to Use:**
  - Refactoring complex components, implementing new API hooks, or adding database collection rules.
* **Rules to Follow:**
  - **Minimal Impact:** Make the smallest possible change that achieves the goal.
  - **Server-Side Security:** Authorization and entitlement rules live strictly in PocketBase (`pb_hooks/akg.pb.js`); never rely on client-side state for access control.
