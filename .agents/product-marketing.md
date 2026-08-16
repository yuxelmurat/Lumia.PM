# Product Marketing Context

**Document version:** v1
**Last updated:** 2026-08-16

## Product Overview
**One-liner:** Project management built for interior architecture and design studios — with client render approval built in.

**What it does:** Lumia.PM lets a studio plan projects and run tasks internally like any PM tool, then share a branded, no-login client link so a client can review renders, leave pinned feedback on a specific spot in an image, and approve or request changes — without ever seeing the studio's internal workspace. It's self-hosted and open source.

**Product category:** Project management software for creative/visual studios (interior architecture & design). Adjacent categories customers search under: "PM tool for design studios," "client approval software," "render review tool," "self-hosted project management."

**Product type:** Self-hosted, open-source (MIT) web application, with an optional managed-hosting add-on ("Lumia.PM Cloud").

**Business model:** Open-core-style freemium. Self-hosting is free forever (no seat limits, no feature gate). Lumia.PM Cloud is an optional paid managed-hosting plan (14-day free trial, no credit card required; billed via PayTR). Accounts created before paid plans launched keep free Cloud access for at least 12 months, with 6 months' notice before anything changes, and a full export/self-hosting path either way.

## Target Audience
**Target companies:** Small-to-midsize interior architecture and design studios, and similar visually-driven creative studios where client-facing deliverables are images (renders, mood boards, material specs) rather than code or documents. Company size: typically a handful to a few dozen people — small enough that a "real" enterprise PM tool is overkill, but with enough concurrent projects that email/WhatsApp/shared-drive coordination breaks down.

**Decision-makers:** Studio owners/principals and project managers/studio managers. They're the ones frustrated by client feedback scattered across email/WhatsApp and by files named `render_v1_final_v2_FINAL.jpg`.

**Primary use case:** Coordinating an interior design project internally (tasks, renders, materials, timeline) while managing a structured, branded client approval loop on renders and deliverables.

**Jobs to be done:**
- Get a non-technical client to review and approve a render without asking them to create an account or learn a tool
- Never lose track of which revision of a render is the current one, or what changed between them
- Know, with certainty, who has and hasn't signed off before work proceeds

**Use cases:**
- Sharing a render with a client for approval, collecting feedback pinned to an exact spot on the image
- Running the internal task board for a project (design phases, procurement, site visits) alongside the client-facing approval flow
- Tracking a project's FF&E/material list as structured task data instead of a spreadsheet
- Standardizing new projects with templates and custom fields so every project starts the same way
- Letting an AI assistant (Claude, Cursor) read/manage tasks and projects directly via the built-in MCP endpoint

## Personas
| Persona | Cares about | Challenge | Value we promise |
|---|---|---|---|
| Studio owner/principal (Decision Maker + Financial Buyer) | Client experience carrying the studio's brand; not paying per-seat for a tool built for software teams | Client feedback and approvals are scattered across email/WhatsApp/shared drives; no single source of truth | A branded, professional client-approval moment; free at unlimited scale if self-hosted |
| Project manager (Champion + User) | Keeping every project moving, knowing render/material status without chasing people | Re-uploaded renders overwrite old versions; unclear who approved what | Full version history, visible approval state, one board for everything |
| Client (end user, not a buyer) | Reviewing and approving renders/design decisions quickly, without friction | Being asked to log into a "real" software tool they don't want to learn | A branded link, no login, obvious way to comment and approve |
| Technical evaluator (Technical Influencer, for self-hosters) | Data ownership, self-hosting feasibility, not being locked into a vendor | Most PM tools are cloud-only SaaS with per-seat pricing | Self-hosted, open source (MIT), Docker Compose or Helm, PostgreSQL, optional Redis |

## Problems & Pain Points
**Core problem:** Studios stitch together a generic task board, a shared drive full of unordered render revisions, an email/WhatsApp thread for client feedback, and a spreadsheet for the material list — because no single tool models the studio's actual workflow.

**Why alternatives fall short:**
- Generic PM tools (Trello, Asana, Monday, ClickUp, Jira, Linear) have no native concept of a branded, login-free client approval moment — it's simulated with a paid guest seat or a bolted-on e-sign/form tool
- Comments in generic tools attach to a card, not a point on an image, so "the shadow in the top-left corner is wrong" turns into a paragraph of description instead of a pin
- Re-uploading a revised render typically overwrites the old file or piles up as an unordered attachment — there's no real version history
- Approval, when it exists at all, is simulated with checklists, not a real, resettable, multi-approver state
- Other open-source Trello-style boards (e.g. Planka) solve the self-hosting/ownership problem but not the studio-specific client-approval workflow

**What it costs them:** Time spent re-explaining feedback that got lost in an email thread; risk of a client seeing (or a team member shipping) an outdated render because "final_v2" wasn't actually final; per-seat SaaS costs that scale badly as a studio grows its team.

**Emotional tension:** The anxiety of not being 100% sure a client actually approved the version currently in production, and the awkwardness of asking a client to "just make an account" in a tool that wasn't built for them.

## Competitive Landscape
**Direct:** Other self-hosted/open-source project boards, most directly **Planka** (Lumia.PM ships a Planka-import tool and a `planka-alternative` comparison page) — same self-hosted/open-source positioning, same problem (generic project boards), but no studio-specific render-approval workflow.

**Secondary:** Cloud PM tools studios actually use today — **Trello, Asana, Monday.com, ClickUp, Jira, Linear** (Lumia.PM has dedicated alternative pages for Jira, Trello, and Linear). Different, broader solution to the same underlying problem (organizing project work); they're mature, general-purpose, have larger integration marketplaces and more polished mobile apps — real strengths for teams that just need a generic board. They fall short specifically on: no-login branded client approval, pinned render feedback, image version history, multi-approver reset workflows, automatic watermarking, self-hosting/data ownership, and open-source/free-at-scale economics.

**Indirect:** The "no tool" approach — a shared drive (Google Drive/Dropbox) for renders plus email/WhatsApp for client feedback plus a spreadsheet for materials. Conflicting approach in that it avoids any tool at all; falls short because nothing is structured, versioned, or attributable, and it doesn't scale past a couple of concurrent projects.

## Differentiation
**Key differentiators:**
- No-login, branded client approval link (vs. paid guest seats or third-party e-sign tools)
- Pinned feedback tied to a specific point on a render (vs. card-level comments)
- Full version history on every uploaded image (vs. overwritten or unordered re-uploads)
- Multi-approver approval workflow with a visible, resettable state (vs. checklists)
- Automatic watermarking on client-shared images (vs. manual work outside the tool)
- Self-hosted, open source (MIT), free at unlimited scale (vs. cloud-only, per-seat pricing)
- Native AI tool access via a built-in MCP endpoint (vs. limited/paid APIs)

**How we do it differently:** Instead of being a general-purpose board with client sharing bolted on, Lumia.PM is built around the studio's actual recurring handoff — internal work happens on a normal board, and the client-facing moment (render review → pinned feedback → approval) is a first-class, branded workflow, not a workaround.

**Why that's better:** Studios stop losing revision history, stop chasing approvals over email/WhatsApp, and stop asking clients to learn a tool they'll only ever touch once or twice per project — while keeping full ownership of their data.

**Why customers choose us:** They need the studio-specific parts (render approval, version history, client-branded sharing) that generic tools don't model natively, and/or they want to self-host and own their data without per-seat cloud pricing.

## Objections
| Objection | Response |
|---|---|
| "We already have Trello/Asana/Monday — why switch?" | Keep it if you only need a generic board. Lumia.PM exists for what those tools don't do natively: no-login client approval, pinned render feedback, version history, and multi-approver sign-off — today those are solved with a separate e-sign tool, a shared drive, and a checklist someone has to remember to update. |
| "Self-hosting sounds like effort." | The Docker Compose quick start is a single combined container plus Postgres; there's also Lumia.PM Cloud (managed hosting, 14-day free trial) if you'd rather not run it yourself. |
| "Is this actually maintained, or just a rebranded fork?" | It's an active fork of the open-source Kaneo project, under MIT license, with the fork's origin disclosed in the README/About page — not hidden. Development continues independently under the Lumia.app brand. |

**Anti-persona:** Software/engineering teams that need a general-purpose issue tracker or sprint board — Lumia.PM is opinionated toward studio workflows (renders, client approval, material specs) and isn't trying to compete on breadth with Jira/Linear for that use case.

## Switching Dynamics
**Push:** Losing track of which render revision is current; client feedback scattered across email/WhatsApp; per-seat SaaS costs; discomfort asking clients to log into an internal tool.

**Pull:** A branded, no-login client approval link; real version history; a workflow that already matches how the studio works, out of the box.

**Habit:** The team already knows Trello/Asana/Monday; migrating existing boards and getting the team to adopt a new tool takes effort.

**Anxiety:** Will self-hosting be reliable without an ops team? Will clients actually find the branded link easy to use? Will migrating existing projects/boards be painful?

## Customer Language
**How they describe the problem:**
- "render_v1_final_v2_FINAL.jpg" (the studio has to invent this pattern because nothing versions images for them)
- Client feedback "scattered across email/WhatsApp" with no single record of what was said where

**How they describe us:**
- "Project management that illuminates projects" / "Projeleri aydınlatan yönetim." — the product's own tagline, plays on Lumia (light) + illuminating a project's status

**Words to use:** render, revision, version history, pinned feedback, branded client link, self-hosted, studio, approval.

**Words to avoid:** "enterprise," "issue tracker," "sprint" — signals aimed at software teams, not design studios.

**Glossary:**
| Term | Meaning |
|---|---|
| Workspace | Top-level collaboration and authorization boundary in Lumia.PM |
| Project | A task container inside a workspace (typically one client engagement) |
| Public/client link | The branded, no-login URL a client uses to review and approve a project's renders |
| Pin | A comment tied to an exact point on an image, not just attached to a task card |
| Approval | The task/render sign-off state; can require multiple approvers and can be reset if changes are requested |

## Brand Voice
**Tone:** Direct, honest, calm — not oversold or hype-driven. Explicitly acknowledges where generic competitors are genuinely stronger (mobile apps, integration marketplace, general-purpose breadth) instead of claiming to win on everything.

**Style:** Plain, concrete, benefit-first. Prefers "here's the specific workflow this solves" over abstract feature lists. Bilingual by default (English and Turkish) — both are treated as first-class, not a translated afterthought.

**Personality (3–5 adjectives):** Honest, focused, craft-minded, self-hosted-first, quietly confident.

## Proof Points
**Metrics:** None public yet (no published customer count, adoption numbers, or case studies as of this writing) — do not fabricate figures; update this section once real numbers exist.

**Customers:** None named publicly yet.

**Testimonials:** None collected yet.

**Value themes:**
| Theme | Proof |
|---|---|
| Real self-hosting, not just a claim | Open source under MIT, Docker Compose and Helm chart both in the repo, verifiable by anyone |
| Client approval is a first-class workflow, not a workaround | Branded no-login public links, pinned image feedback, multi-approver approval with reset — all built into the product, not simulated with checklists |
| AI-native | Built-in MCP HTTP endpoint (`/api/mcp`) for direct AI assistant access — most competitors offer this as a limited or paid add-on, if at all |

## Goals
**Primary business goal:** Grow adoption among interior design studios (self-hosted installs and Lumia.PM Cloud signups), establishing Lumia.PM as the default choice for studios that have outgrown generic PM tools.

**Key conversion action:** Docker Compose quick start / Lumia.PM Cloud free trial signup (14 days, no credit card).

**Current metrics:** Not yet tracked/published — revisit this section once analytics or Cloud signup data exists.

## Changelog
*Newest first. One line per revision: what changed and why.*
- v1 (2026-08-16) — Initial context, auto-drafted from the README, AGENTS.md, codebase (apps/api/src module list, apps/site pages), and the comparison-table work already done in this repo's README.
