import * as v from "valibot";

export const labelSchema = v.object({
  id: v.string(),
  name: v.string(),
  color: v.string(),
  createdAt: v.date(),
  taskId: v.nullable(v.string()),
  workspaceId: v.nullable(v.string()),
});

export const projectSchema = v.object({
  id: v.string(),
  workspaceId: v.string(),
  slug: v.string(),
  icon: v.nullable(v.string()),
  name: v.string(),
  description: v.nullable(v.string()),
  createdAt: v.date(),
  isPublic: v.nullable(v.boolean()),
  archivedAt: v.nullable(v.date()),
  position: v.number(),
});

export const taskSchema = v.object({
  id: v.string(),
  projectId: v.string(),
  position: v.nullable(v.number()),
  number: v.nullable(v.number()),
  userId: v.nullable(v.string()),
  title: v.string(),
  description: v.nullable(v.string()),
  status: v.string(),
  priority: v.picklist([
    "no-priority",
    "low",
    "medium",
    "high",
    "urgent",
  ] as const),
  startDate: v.optional(v.date()),
  dueDate: v.optional(v.date()),
  createdAt: v.date(),
});

export const activitySchema = v.object({
  id: v.string(),
  taskId: v.string(),
  type: v.picklist([
    "comment",
    "task",
    "status_changed",
    "priority_changed",
    "unassigned",
    "assignee_changed",
    "due_date_changed",
    "title_changed",
    "description_changed",
    "create",
  ] as const),
  createdAt: v.date(),
  userId: v.nullable(v.string()),
  content: v.nullable(v.string()),
  eventData: v.nullable(v.record(v.string(), v.unknown())),
  externalUserName: v.nullable(v.string()),
  externalUserAvatar: v.nullable(v.string()),
  externalSource: v.nullable(v.string()),
  externalUrl: v.nullable(v.string()),
});

export const timeEntrySchema = v.object({
  id: v.string(),
  taskId: v.string(),
  userId: v.nullable(v.string()),
  description: v.nullable(v.string()),
  startTime: v.date(),
  endTime: v.optional(v.date()),
  duration: v.nullable(v.number()),
  createdAt: v.date(),
  updatedAt: v.date(),
});

export const notificationSchema = v.object({
  id: v.string(),
  userId: v.string(),
  title: v.nullable(v.string()),
  content: v.nullable(v.string()),
  type: v.picklist([
    "info",
    "task_created",
    "workspace_created",
    "task_status_changed",
    "task_assignee_changed",
    "time_entry_created",
    "due_date_reminder",
    "task_overdue",
    "task_mention",
    "task_comment",
  ] as const),
  eventData: v.nullable(v.record(v.string(), v.unknown())),
  isRead: v.optional(v.boolean()),
  resourceId: v.optional(v.string()),
  resourceType: v.optional(v.picklist(["task", "workspace"] as const)),
  createdAt: v.date(),
  updatedAt: v.date(),
});

export const notificationPreferenceWorkspaceRuleSchema = v.object({
  id: v.string(),
  workspaceId: v.string(),
  workspaceName: v.string(),
  isActive: v.boolean(),
  emailEnabled: v.boolean(),
  ntfyEnabled: v.boolean(),
  gotifyEnabled: v.boolean(),
  webhookEnabled: v.boolean(),
  projectMode: v.picklist(["all", "selected"] as const),
  selectedProjectIds: v.array(v.string()),
  createdAt: v.date(),
  updatedAt: v.date(),
});

export const notificationPreferenceSchema = v.object({
  emailAddress: v.nullable(v.string()),
  emailEnabled: v.boolean(),
  ntfyEnabled: v.boolean(),
  ntfyConfigured: v.boolean(),
  ntfyServerUrl: v.nullable(v.string()),
  ntfyTopic: v.nullable(v.string()),
  ntfyTokenConfigured: v.boolean(),
  maskedNtfyToken: v.nullable(v.string()),
  gotifyEnabled: v.boolean(),
  gotifyConfigured: v.boolean(),
  gotifyServerUrl: v.nullable(v.string()),
  gotifyTokenConfigured: v.boolean(),
  maskedGotifyToken: v.nullable(v.string()),
  webhookEnabled: v.boolean(),
  webhookConfigured: v.boolean(),
  webhookUrl: v.nullable(v.string()),
  webhookSecretConfigured: v.boolean(),
  maskedWebhookSecret: v.nullable(v.string()),
  taskAssignmentEnabled: v.boolean(),
  taskCommentEnabled: v.boolean(),
  taskStatusChangeEnabled: v.boolean(),
  dueDateReminderEnabled: v.boolean(),
  dueDateReminderLeadTimeMinutes: v.number(),
  workspaces: v.array(notificationPreferenceWorkspaceRuleSchema),
  createdAt: v.nullable(v.date()),
  updatedAt: v.nullable(v.date()),
});

export const githubIntegrationSchema = v.object({
  id: v.string(),
  projectId: v.string(),
  repositoryOwner: v.string(),
  repositoryName: v.string(),
  installationId: v.nullable(v.number()),
  branchPattern: v.optional(v.string()),
  commentTaskLinkOnGitHubIssue: v.optional(v.boolean()),
  isActive: v.nullable(v.boolean()),
  createdAt: v.date(),
  updatedAt: v.date(),
});

export const giteaIntegrationSchema = v.object({
  id: v.string(),
  projectId: v.string(),
  baseUrl: v.string(),
  repositoryOwner: v.string(),
  repositoryName: v.string(),
  maskedAccessToken: v.string(),
  webhookUrl: v.optional(v.string()),
  webhookSecret: v.optional(v.string()),
  branchPattern: v.optional(v.string()),
  commentTaskLinkOnGiteaIssue: v.optional(v.boolean()),
  isActive: v.nullable(v.boolean()),
  createdAt: v.date(),
  updatedAt: v.date(),
});

export const integrationEventsSchema = v.object({
  taskCreated: v.boolean(),
  taskStatusChanged: v.boolean(),
  taskPriorityChanged: v.boolean(),
  taskTitleChanged: v.boolean(),
  taskDescriptionChanged: v.boolean(),
  taskCommentCreated: v.boolean(),
});

export const slackIntegrationSchema = v.object({
  id: v.string(),
  projectId: v.string(),
  channelName: v.nullable(v.string()),
  webhookConfigured: v.boolean(),
  maskedWebhookUrl: v.string(),
  events: integrationEventsSchema,
  isActive: v.nullable(v.boolean()),
  createdAt: v.date(),
  updatedAt: v.date(),
});

export const discordIntegrationSchema = v.object({
  id: v.string(),
  projectId: v.string(),
  channelName: v.nullable(v.string()),
  webhookConfigured: v.boolean(),
  maskedWebhookUrl: v.string(),
  events: integrationEventsSchema,
  isActive: v.nullable(v.boolean()),
  createdAt: v.date(),
  updatedAt: v.date(),
});

export const genericWebhookIntegrationSchema = v.object({
  id: v.string(),
  projectId: v.string(),
  webhookConfigured: v.boolean(),
  maskedWebhookUrl: v.nullable(v.string()),
  secretConfigured: v.boolean(),
  maskedSecret: v.nullable(v.string()),
  events: v.object({
    ...integrationEventsSchema.entries,
    taskDeleted: v.boolean(),
    taskMoved: v.boolean(),
    taskDueDateChanged: v.boolean(),
    taskAssigneeChanged: v.boolean(),
    taskUnassigned: v.boolean(),
    dueDateReminder: v.boolean(),
  }),
  dueDateReminderLeadTimeMinutes: v.number(),
  isActive: v.nullable(v.boolean()),
  createdAt: v.date(),
  updatedAt: v.date(),
});

export const telegramIntegrationSchema = v.object({
  id: v.string(),
  projectId: v.string(),
  chatId: v.string(),
  threadId: v.nullable(v.number()),
  chatLabel: v.nullable(v.string()),
  botTokenConfigured: v.boolean(),
  maskedBotToken: v.string(),
  events: integrationEventsSchema,
  isActive: v.nullable(v.boolean()),
  createdAt: v.date(),
  updatedAt: v.date(),
});

export const commentSchema = v.object({
  id: v.string(),
  taskId: v.string(),
  userId: v.string(),
  content: v.string(),
  createdAt: v.date(),
  updatedAt: v.date(),
  user: v.optional(
    v.object({
      name: v.string(),
      image: v.nullable(v.string()),
    }),
  ),
});

export const assetPinAuthorSchema = v.object({
  type: v.picklist(["user", "guest"]),
  id: v.string(),
  name: v.nullable(v.string()),
});

export const assetPinNoteSchema = v.object({
  id: v.string(),
  pinId: v.string(),
  content: v.string(),
  createdAt: v.date(),
  author: assetPinAuthorSchema,
});

export const assetPinSchema = v.object({
  id: v.string(),
  assetId: v.string(),
  x: v.nullable(v.number()),
  y: v.nullable(v.number()),
  viewerState: v.nullable(v.any()),
  status: v.picklist(["open", "resolved"]),
  label: v.nullable(v.string()),
  createdAt: v.date(),
  resolvedAt: v.nullable(v.date()),
  author: assetPinAuthorSchema,
  notes: v.array(assetPinNoteSchema),
});

export const assetShareLinkSchema = v.object({
  id: v.string(),
  assetId: v.string(),
  token: v.string(),
  expiresAt: v.nullable(v.date()),
  revokedAt: v.nullable(v.date()),
  createdAt: v.date(),
});

export const assetApprovalEventSchema = v.object({
  id: v.string(),
  assetId: v.string(),
  status: v.picklist(["pending", "approved", "changes_requested"]),
  note: v.nullable(v.string()),
  createdAt: v.date(),
  actor: assetPinAuthorSchema,
});

export const productSpecSchema = v.object({
  id: v.string(),
  projectId: v.string(),
  roomLabel: v.nullable(v.string()),
  name: v.string(),
  vendor: v.nullable(v.string()),
  unitCost: v.nullable(v.number()),
  quantity: v.number(),
  status: v.picklist([
    "proposed",
    "client_approved",
    "ordered",
    "received",
    "installed",
  ]),
  imageAssetId: v.nullable(v.string()),
  linkedPinId: v.nullable(v.string()),
  notes: v.nullable(v.string()),
  createdAt: v.date(),
  updatedAt: v.date(),
});

export const configSchema = v.object({
  disableRegistration: v.nullable(v.boolean()),
  disablePasswordRegistration: v.nullable(v.boolean()),
  disableEmailOtpSignIn: v.nullable(v.boolean()),
  isDemoMode: v.boolean(),
  hasSmtp: v.boolean(),
  hasGithubSignIn: v.nullable(v.boolean()),
  hasGoogleSignIn: v.nullable(v.boolean()),
  hasDiscordSignIn: v.nullable(v.boolean()),
  hasCustomOAuth: v.nullable(v.boolean()),
  hasGuestAccess: v.nullable(v.boolean()),
  disableLoginForm: v.nullable(v.boolean()),
  customOAuthAutoLogin: v.nullable(v.boolean()),
  customOAuthLogoutUrl: v.nullable(v.string()),
  billingEnabled: v.boolean(),
});
