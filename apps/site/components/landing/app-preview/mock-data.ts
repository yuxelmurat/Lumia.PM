import type { ExternalLink } from "@/types/external-link";
import type { ProjectWithTasks } from "@/types/project";
import type Task from "@/types/task";

// Extended task type – same base Task but with embedded labels and
// optional external links (just like the real API returns them).
export type TaskWithExtras = Task & {
  labels?: Array<{ id: string; name: string; color: string }>;
  externalLinks?: Array<ExternalLink>;
};

// ------------------------------------------------------------------
// Mock workspace — an interior architecture studio, the audience
// Lumia.PM is actually built for.
// ------------------------------------------------------------------
export const MOCK_WORKSPACE = {
  id: "ws-preview",
  name: "Atelier Norda",
  slug: "norda",
};

// ------------------------------------------------------------------
// Mock workspace labels
// ------------------------------------------------------------------
export const MOCK_WORKSPACE_LABELS = [
  { id: "lbl-1", name: "urgent", color: "#ef4444" },
  { id: "lbl-2", name: "client-review", color: "#6366f1" },
  { id: "lbl-3", name: "materials", color: "#10b981" },
  { id: "lbl-4", name: "site-visit", color: "#f59e0b" },
  { id: "lbl-5", name: "concept", color: "#8b5cf6" },
];

// ------------------------------------------------------------------
// Mock users
// ------------------------------------------------------------------
export const MOCK_USERS = {
  members: [
    { userId: "u-1", user: { name: "Elif Aydın", image: null } },
    { userId: "u-2", user: { name: "Deniz Kaya", image: null } },
    { userId: "u-3", user: { name: "Mert Yıldız", image: null } },
    { userId: "u-4", user: { name: "Selin Aksoy", image: null } },
  ],
};

// ------------------------------------------------------------------
// Helper timestamps / dates
// ------------------------------------------------------------------
const CREATED_AT = "2024-01-01T00:00:00.000Z";
const UPDATED_AT = "2024-07-01T00:00:00.000Z";

const d = (offset: number): string => {
  const dt = new Date();
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString();
};

// ------------------------------------------------------------------
// Project 1: Residence Belvedere
// ------------------------------------------------------------------
const RES_ID = "p-1";
const WS_ID = "ws-preview";

const resTasks: TaskWithExtras[] = [
  {
    id: "t-101",
    number: 1,
    title: "Upload living room concept render",
    description:
      "First-pass render for the main living space — warm palette, walnut flooring, linen upholstery. Ready for client review.",
    priority: "high",
    status: "in-progress",
    position: 1,
    startDate: d(-3),
    dueDate: d(2),
    userId: "u-1",
    projectId: RES_ID,
    workspaceId: WS_ID,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    assigneeName: "Elif Aydın",
    assigneeImage: null,
    labels: [{ id: "lbl-2", name: "client-review", color: "#6366f1" }],
  },
  {
    id: "t-102",
    number: 2,
    title: "Confirm stone supplier for kitchen island",
    description:
      "Compare two limestone suppliers on lead time and slab consistency before locking the material spec.",
    priority: "medium",
    status: "in-progress",
    position: 2,
    startDate: d(1),
    dueDate: d(5),
    userId: "u-3",
    projectId: RES_ID,
    workspaceId: WS_ID,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    assigneeName: "Mert Yıldız",
    assigneeImage: null,
    labels: [{ id: "lbl-3", name: "materials", color: "#10b981" }],
  },
  {
    id: "t-103",
    number: 3,
    title: "Site visit — verify window dimensions",
    description:
      "Re-measure the bay window before finalizing the built-in seating render.",
    priority: "urgent",
    status: "to-do",
    position: 1,
    startDate: d(-4),
    dueDate: d(-1),
    userId: "u-4",
    projectId: RES_ID,
    workspaceId: WS_ID,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    assigneeName: "Selin Aksoy",
    assigneeImage: null,
    labels: [{ id: "lbl-4", name: "site-visit", color: "#f59e0b" }],
  },
  {
    id: "t-104",
    number: 4,
    title: "Draft lighting plan — dining area",
    description:
      "Layer ambient, task, and accent lighting for the dining nook per the revised ceiling plan.",
    priority: "low",
    status: "to-do",
    position: 2,
    startDate: d(7),
    dueDate: d(14),
    userId: "u-2",
    projectId: RES_ID,
    workspaceId: WS_ID,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    assigneeName: "Deniz Kaya",
    assigneeImage: null,
    labels: [],
  },
  {
    id: "t-105",
    number: 5,
    title: "Review client change request — sofa color",
    description:
      "Client asked for a warmer neutral. Update material board and re-render before next approval round.",
    priority: "high",
    status: "in-review",
    position: 1,
    startDate: d(-1),
    dueDate: d(3),
    userId: "u-3",
    projectId: RES_ID,
    workspaceId: WS_ID,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    assigneeName: "Mert Yıldız",
    assigneeImage: null,
    labels: [{ id: "lbl-5", name: "concept", color: "#8b5cf6" }],
  },
  {
    id: "t-106",
    number: 6,
    title: "Client approved entryway concept",
    description:
      "Signed off via the shared review link — proceed to detailed drawings.",
    priority: "medium",
    status: "done",
    position: 1,
    startDate: d(18),
    dueDate: null,
    userId: "u-4",
    projectId: RES_ID,
    workspaceId: WS_ID,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    assigneeName: "Selin Aksoy",
    assigneeImage: null,
    labels: [{ id: "lbl-2", name: "client-review", color: "#6366f1" }],
  },
  {
    id: "t-107",
    number: 7,
    title: "Compile material board for handover",
    description:
      "Consolidate approved finishes into a single reference board for the contractor.",
    priority: "medium",
    status: "done",
    position: 2,
    startDate: d(23),
    dueDate: null,
    userId: "u-2",
    projectId: RES_ID,
    workspaceId: WS_ID,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    assigneeName: "Deniz Kaya",
    assigneeImage: null,
    labels: [{ id: "lbl-3", name: "materials", color: "#10b981" }],
  },
];

export const WEB_PROJECT: ProjectWithTasks = {
  id: RES_ID,
  name: "Residence Belvedere",
  slug: "RES",
  description: "Full interior concept for a private residence, living areas.",
  icon: null,
  workspaceId: WS_ID,
  isPublic: false,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  columns: [
    {
      id: "to-do",
      name: "To Do",
      order: 0,
      isFinal: false,
      projectId: RES_ID,
      tasks: resTasks.filter((t) => t.status === "to-do"),
    },
    {
      id: "in-progress",
      name: "In Progress",
      order: 1,
      isFinal: false,
      projectId: RES_ID,
      tasks: resTasks.filter((t) => t.status === "in-progress"),
    },
    {
      id: "in-review",
      name: "In Review",
      order: 2,
      isFinal: false,
      projectId: RES_ID,
      tasks: resTasks.filter((t) => t.status === "in-review"),
    },
    {
      id: "done",
      name: "Done",
      order: 3,
      isFinal: true,
      projectId: RES_ID,
      tasks: resTasks.filter((t) => t.status === "done"),
    },
  ],
};

// ------------------------------------------------------------------
// Project 2: The Wren Hotel — Lobby Redesign
// ------------------------------------------------------------------
const WRN_ID = "p-2";

const wrnTasks: TaskWithExtras[] = [
  {
    id: "t-201",
    number: 1,
    title: "Render lobby reception concept — option A",
    description:
      "Brass accents, dark oak millwork, oversized pendant. Prepare for first client review round.",
    priority: "high",
    status: "in-progress",
    position: 1,
    startDate: d(2),
    dueDate: d(7),
    userId: "u-1",
    projectId: WRN_ID,
    workspaceId: WS_ID,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    assigneeName: "Elif Aydın",
    assigneeImage: null,
    labels: [{ id: "lbl-5", name: "concept", color: "#8b5cf6" }],
  },
  {
    id: "t-202",
    number: 2,
    title: "Source lounge seating supplier",
    description:
      "Ownership group wants a local upholsterer. Get three quotes with lead times before the next design review.",
    priority: "high",
    status: "to-do",
    position: 1,
    startDate: d(5),
    dueDate: d(10),
    userId: "u-4",
    projectId: WRN_ID,
    workspaceId: WS_ID,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    assigneeName: "Selin Aksoy",
    assigneeImage: null,
    labels: [{ id: "lbl-3", name: "materials", color: "#10b981" }],
  },
  {
    id: "t-203",
    number: 3,
    title: "Client review — signage and wayfinding",
    description:
      "Awaiting sign-off on typography and placement before fabrication drawings begin.",
    priority: "urgent",
    status: "in-review",
    position: 1,
    startDate: d(-2),
    dueDate: d(1),
    userId: "u-3",
    projectId: WRN_ID,
    workspaceId: WS_ID,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    assigneeName: "Mert Yıldız",
    assigneeImage: null,
    labels: [
      { id: "lbl-2", name: "client-review", color: "#6366f1" },
      { id: "lbl-4", name: "site-visit", color: "#f59e0b" },
    ],
  },
  {
    id: "t-204",
    number: 4,
    title: "Coordinate acoustic ceiling with contractor",
    description:
      "Confirm the perforated panel spec meets the venue's acoustic requirement before ordering.",
    priority: "medium",
    status: "to-do",
    position: 2,
    startDate: d(15),
    dueDate: d(21),
    userId: null,
    projectId: WRN_ID,
    workspaceId: WS_ID,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    labels: [],
  },
  {
    id: "t-205",
    number: 5,
    title: "Client approved lobby flooring",
    description:
      "Terrazzo pattern signed off through the shared review link — release to procurement.",
    priority: "medium",
    status: "done",
    position: 1,
    startDate: d(25),
    dueDate: null,
    userId: "u-3",
    projectId: WRN_ID,
    workspaceId: WS_ID,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    assigneeName: "Mert Yıldız",
    assigneeImage: null,
    labels: [{ id: "lbl-2", name: "client-review", color: "#6366f1" }],
  },
];

export const MOB_PROJECT: ProjectWithTasks = {
  id: WRN_ID,
  name: "The Wren Hotel — Lobby Redesign",
  slug: "WRN",
  description: "Lobby and reception redesign for a boutique hotel client.",
  icon: null,
  workspaceId: WS_ID,
  isPublic: false,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  columns: [
    {
      id: "to-do",
      name: "To Do",
      order: 0,
      isFinal: false,
      projectId: WRN_ID,
      tasks: wrnTasks.filter((t) => t.status === "to-do"),
    },
    {
      id: "in-progress",
      name: "In Progress",
      order: 1,
      isFinal: false,
      projectId: WRN_ID,
      tasks: wrnTasks.filter((t) => t.status === "in-progress"),
    },
    {
      id: "in-review",
      name: "In Review",
      order: 2,
      isFinal: false,
      projectId: WRN_ID,
      tasks: wrnTasks.filter((t) => t.status === "in-review"),
    },
    {
      id: "done",
      name: "Done",
      order: 3,
      isFinal: true,
      projectId: WRN_ID,
      tasks: wrnTasks.filter((t) => t.status === "done"),
    },
  ],
};

export const MOCK_PROJECTS: ProjectWithTasks[] = [WEB_PROJECT, MOB_PROJECT];
