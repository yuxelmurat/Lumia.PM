import type { Comparison } from "@/components/landing/comparison-page";

export const comparisons: Record<string, Comparison> = {
  jira: {
    competitor: "Jira",
    heading: "The open-source Jira alternative",
    subheading:
      "Jira can run a 500-person org, but most teams just want to plan and ship work without the weight. Lumia.PM is a simple, open-source project manager you can self-host or let us run for you.",
    rows: [
      { feature: "Open source (MIT)", kaneo: true, them: false },
      { feature: "Self-hostable", kaneo: true, them: "Data Center only" },
      { feature: "Own your data", kaneo: true, them: false },
      { feature: "Free to self-host", kaneo: true, them: false },
      { feature: "SSO included", kaneo: "Free", them: "Paid tier" },
      { feature: "Setup", kaneo: "Minutes", them: "Involved" },
      { feature: "Learning curve", kaneo: "Minutes", them: "Steep" },
      {
        feature: "Cloud pricing",
        kaneo: "From $4/mo",
        them: "Per user, higher",
      },
    ],
    reasons: [
      {
        title: "No bloat",
        body: "Boards, backlog, and workflows that work out of the box. No admin console to configure for a week before you can create a task.",
      },
      {
        title: "Own your data",
        body: "Self-host Lumia.PM on your own servers under the MIT license, or use our EU-hosted cloud. Either way you can export everything, anytime.",
      },
      {
        title: "Fair, honest pricing",
        body: "Free forever to self-host, including SSO. Managed cloud starts at $4/month with no per-feature paywalls.",
      },
    ],
    honestNote:
      "If you're a large organization that needs deep enterprise workflows, advanced permission schemes, and a big marketplace of add-ons, and you have the time to configure it, Jira is built for exactly that. Lumia.PM is for teams who want to manage work, not administer a tool.",
  },
  trello: {
    competitor: "Trello",
    heading: "The self-hostable Trello alternative",
    subheading:
      "Trello nails simple kanban, but your boards live on someone else's servers and grow into paid Power-Ups. Lumia.PM keeps the simplicity, adds backlog and workflows, and lets you own the whole thing.",
    rows: [
      { feature: "Open source (MIT)", kaneo: true, them: false },
      { feature: "Self-hostable", kaneo: true, them: false },
      { feature: "Own your data", kaneo: true, them: false },
      { feature: "Kanban boards", kaneo: true, them: true },
      { feature: "Backlog & workflows", kaneo: true, them: "Power-Ups" },
      { feature: "Free to self-host", kaneo: true, them: false },
      { feature: "SSO included", kaneo: "Free", them: "Enterprise" },
      { feature: "Cloud pricing", kaneo: "From $4/mo", them: "Per user" },
    ],
    reasons: [
      {
        title: "Just as simple",
        body: "A clean board you can use in minutes, with no manual and no onboarding wizard. Lumia.PM keeps the thing people love about Trello.",
      },
      {
        title: "Room to grow",
        body: "Backlog planning, custom workflows, and roles are built in, so you don't hit a wall and start bolting on paid Power-Ups.",
      },
      {
        title: "Your boards, your servers",
        body: "Self-host under MIT for free, or use our managed cloud. Your data is exportable and never locked in.",
      },
    ],
    honestNote:
      "If you only need a couple of personal boards, never want to self-host, and Trello's free tier covers you, it's a perfectly good choice. Lumia.PM makes more sense the moment you care about owning your data or your team outgrows a simple board.",
  },
  linear: {
    competitor: "Linear",
    heading: "The open-source Linear alternative",
    subheading:
      "Linear is fast and beautifully focused, but it's closed-source, cloud-only, and you can't run it yourself. Lumia.PM gives you a clean, focused workflow that's open source and self-hostable.",
    rows: [
      { feature: "Open source (MIT)", kaneo: true, them: false },
      { feature: "Self-hostable", kaneo: true, them: false },
      { feature: "Own your data", kaneo: true, them: false },
      { feature: "Fast, focused UI", kaneo: true, them: true },
      { feature: "Free to self-host", kaneo: true, them: false },
      { feature: "SSO included", kaneo: "Free", them: "Paid plans" },
      { feature: "Cloud pricing", kaneo: "From $4/mo", them: "Per user" },
    ],
    reasons: [
      {
        title: "Clean and focused",
        body: "Lumia.PM is built around the same idea Linear popularized: a fast, uncluttered way to plan and execute, without the SaaS lock-in.",
      },
      {
        title: "Open and self-hostable",
        body: "Run Lumia.PM on your own infrastructure under the MIT license, keep your data in-house, and never depend on a vendor staying online.",
      },
      {
        title: "Honest pricing",
        body: "Free forever to self-host with every feature, including SSO. Managed cloud from $4/month, with no seats-gated features.",
      },
    ],
    honestNote:
      "Linear sets the bar for polish, speed, and deep product-team features like cycles and triage. If you're committed to cloud SaaS and want that specific, highly-refined workflow, it's excellent. Lumia.PM is for teams who want a clean experience they can actually own.",
  },
  asana: {
    competitor: "Asana",
    heading: "The open-source Asana alternative",
    subheading:
      "Asana packs in timelines, portfolios, and workflow rules for every team under the sun, but it's closed-source, cloud-only, and the price climbs fast per seat. Lumia.PM covers the project-management essentials, stays open source, and you can self-host it for free.",
    rows: [
      { feature: "Open source (MIT)", kaneo: true, them: false },
      { feature: "Self-hostable", kaneo: true, them: false },
      { feature: "Own your data", kaneo: true, them: false },
      { feature: "Kanban boards", kaneo: true, them: true },
      { feature: "Backlog & workflows", kaneo: true, them: "Paid tiers" },
      { feature: "Free to self-host", kaneo: true, them: false },
      { feature: "SSO included", kaneo: "Free", them: "Enterprise tier" },
      {
        feature: "Cloud pricing",
        kaneo: "From $4/mo",
        them: "Per user, higher",
      },
    ],
    reasons: [
      {
        title: "Focused, not sprawling",
        body: "Asana's feature surface spans goals, portfolios, and forms most teams never touch. Lumia.PM sticks to boards, backlog, and workflows so there's less to configure and less to pay for.",
      },
      {
        title: "Own your data",
        body: "Self-host Lumia.PM under the MIT license, or use our EU-hosted cloud. Either way, everything exports and nothing is locked behind a vendor's servers.",
      },
      {
        title: "Fair, honest pricing",
        body: "Free forever to self-host, including SSO. Managed cloud starts at $4/month, with no per-feature paywalls as your team grows.",
      },
    ],
    honestNote:
      "If your org genuinely needs Asana's breadth — goal tracking, resource management, and a large app marketplace across many departments — it's a mature, capable tool built for that scale. Lumia.PM is for teams who want to manage projects without paying for or configuring features they'll never use.",
  },
  excel: {
    competitor: "Excel & Email",
    heading: "One system instead of spreadsheets and inboxes",
    subheading:
      "A material list in Excel, approvals in email, and questions in WhatsApp is how architecture studios lose track of a project. Lumia.PM keeps RFIs, submittals, change orders, and permits in one auditable place instead of three inboxes.",
    rows: [
      { feature: "Single source of truth", kaneo: true, them: false },
      { feature: "RFI / submittal tracking", kaneo: true, them: false },
      { feature: "Change order log", kaneo: true, them: false },
      { feature: "Version history", kaneo: true, them: "Manual" },
      { feature: "Who-changed-what", kaneo: true, them: false },
      { feature: "Searchable", kaneo: true, them: "Per file" },
      { feature: "Real-time collaboration", kaneo: true, them: "Conflicts" },
    ],
    reasons: [
      {
        title: "Nothing falls through the cracks",
        body: "Every RFI, submittal, and change order lives on the project with an owner and a status, instead of buried in a shared drive or an email thread nobody can find later.",
      },
      {
        title: "One version, not five",
        body: 'No more "final_v3_reallyfinal.xlsx". Everyone works off the same live board, so the file on your screen is always the current one.',
      },
      {
        title: "An actual audit trail",
        body: "Every status change and approval is logged automatically, so when a client or inspector asks what happened, the answer is a click away instead of a search through old emails.",
      },
    ],
    honestNote:
      "Spreadsheets and email are free, familiar, and fine for a one-person job or a project with no moving parts. The moment a project has multiple trades, approvals, and revisions in flight, that same flexibility is what makes things get lost. Lumia.PM is for studios past that point.",
  },
  monday: {
    competitor: "Monday.com",
    heading: "The open-source Monday.com alternative",
    subheading:
      "Monday.com is a flexible work OS with a price tag to match, and it isn't built for architecture-specific workflows out of the box. Lumia.PM ships RFI, submittal, change-order, and permit tracking natively, stays open source, and you can self-host it for free.",
    rows: [
      { feature: "Open source (MIT)", kaneo: true, them: false },
      { feature: "Self-hostable", kaneo: true, them: false },
      { feature: "Own your data", kaneo: true, them: false },
      {
        feature: "RFI / submittal tracking",
        kaneo: "Built in",
        them: "Custom build",
      },
      { feature: "Free to self-host", kaneo: true, them: false },
      { feature: "SSO included", kaneo: "Free", them: "Higher tiers" },
      {
        feature: "Cloud pricing",
        kaneo: "From $4/mo",
        them: "Per seat, higher",
      },
    ],
    reasons: [
      {
        title: "Built for architecture studios",
        body: "RFIs, submittals, change orders, and permit tracking are first-class here, not a generic board you have to configure into looking like a construction workflow.",
      },
      {
        title: "Own your data",
        body: "Self-host Lumia.PM under the MIT license, or use our EU-hosted cloud. Everything exports and nothing is locked behind a vendor's servers.",
      },
      {
        title: "Fair, honest pricing",
        body: "Free forever to self-host, including SSO. Managed cloud starts at $4/month with no per-feature paywalls as your team and seat count grow.",
      },
    ],
    honestNote:
      "If you need a general-purpose work OS spanning marketing, sales, and a dozen other departments beyond project delivery, Monday.com's breadth is real and hard to match. Lumia.PM is for architecture and design studios that want their actual delivery workflows built in, not assembled from generic building blocks.",
  },
  planka: {
    competitor: "PLANKA",
    heading: "The PLANKA alternative with SSO included",
    subheading:
      "PLANKA 2.2 moved SSO into its paid Pro tier, and self-hosters who signed in with OIDC woke up to deactivated accounts. Lumia.PM is MIT-licensed, self-hostable, and ships SSO to everyone at no cost.",
    rows: [
      { feature: "License", kaneo: "MIT", them: "Fair Use (source-available)" },
      { feature: "Self-hostable", kaneo: true, them: true },
      { feature: "Own your data", kaneo: true, them: true },
      { feature: "Kanban boards", kaneo: true, them: true },
      { feature: "SSO / OIDC", kaneo: "Free", them: "Pro only" },
      { feature: "Backlog & workflows", kaneo: true, them: false },
      { feature: "Data export", kaneo: "Built in", them: false },
      { feature: "Cloud pricing", kaneo: "From $4/mo", them: "Per user" },
    ],
    reasons: [
      {
        title: "SSO is not a premium feature",
        body: "Connect Google, GitHub, Discord, or any OIDC provider on the free, self-hosted build. We think authentication is part of running software safely, not an upsell, and we don't plan to move it.",
      },
      {
        title: "Genuinely MIT",
        body: "Lumia.PM is MIT end to end, with no Pro-only files carved out of the repository. You can fork it, run it, and change it without checking which licence a given file falls under.",
      },
      {
        title: "Your data stays portable",
        body: "Every project exports to JSON from the UI, and the whole API is public and documented. Getting out of Lumia.PM is as easy as getting in, which is rather the point.",
      },
    ],
    migration: {
      body: "PLANKA has no export feature, so we wrote an importer that reads your boards straight from its API and recreates them in Lumia.PM: lists, cards, labels, assignees, checklists, and comments. Start with a dry run, which writes nothing.",
      href: "/docs/core/migrations/from-planka",
      linkText: "Read the migration guide",
    },
    honestNote:
      "PLANKA is a good piece of software with a real team behind it, and paid tiers are a legitimate way to fund open-source work. If you're happy on the Community edition with password logins, or SSO is worth the Pro licence to you, there's no reason to move. Lumia.PM is for teams that need SSO and don't want it behind a paywall.",
  },
};
