import { relations } from "drizzle-orm";
import {
  accountTable,
  activityTable,
  apikeyTable,
  assetApprovalEventTable,
  assetGuestTable,
  assetPinNoteTable,
  assetPinTable,
  assetShareLinkTable,
  assetTable,
  changeOrderTable,
  columnTable,
  commentTable,
  customFieldDefinitionTable,
  customFieldValueTable,
  externalLinkTable,
  githubIntegrationTable,
  imagePinTable,
  integrationTable,
  invitationTable,
  labelTable,
  notificationTable,
  permitTable,
  productSpecTable,
  projectTable,
  projectTemplateColumnTable,
  projectTemplateTable,
  projectTemplateTaskTable,
  rfiTable,
  sessionTable,
  submittalTable,
  taskApprovalTable,
  taskRelationTable,
  taskReminderSentTable,
  taskTable,
  teamMemberTable,
  teamTable,
  timeEntryTable,
  userNotificationPreferenceTable,
  userNotificationWorkspaceProjectTable,
  userNotificationWorkspaceRuleTable,
  userTable,
  verificationTable,
  workflowRuleTable,
  workspaceRoleTable,
  workspaceTable,
  workspaceUserTable,
} from "./schema";

export const userTableRelations = relations(userTable, ({ many, one }) => ({
  sessions: many(sessionTable),
  accounts: many(accountTable),
  teamMembers: many(teamMemberTable),
  workspaces: many(workspaceTable),
  workspaceMemberships: many(workspaceUserTable),
  assignedTasks: many(taskTable),
  timeEntries: many(timeEntryTable),
  activities: many(activityTable),
  comments: many(commentTable),
  assets: many(assetTable),
  notifications: many(notificationTable),
  notificationPreference: one(userNotificationPreferenceTable),
  notificationWorkspaceRules: many(userNotificationWorkspaceRuleTable),
  sentInvitations: many(invitationTable),
  apikeys: many(apikeyTable),
}));

export const sessionTableRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}));

export const accountTableRelations = relations(accountTable, ({ one }) => ({
  user: one(userTable, {
    fields: [accountTable.userId],
    references: [userTable.id],
  }),
}));

export const verificationTableRelations = relations(
  verificationTable,
  () => ({}),
);

export const workspaceTableRelations = relations(
  workspaceTable,
  ({ many }) => ({
    teams: many(teamTable),
    members: many(workspaceUserTable),
    projects: many(projectTable),
    assets: many(assetTable),
    invitations: many(invitationTable),
    notificationWorkspaceRules: many(userNotificationWorkspaceRuleTable),
    customFieldDefinitions: many(customFieldDefinitionTable),
    projectTemplates: many(projectTemplateTable),
  }),
);

export const projectTemplateTableRelations = relations(
  projectTemplateTable,
  ({ one, many }) => ({
    workspace: one(workspaceTable, {
      fields: [projectTemplateTable.workspaceId],
      references: [workspaceTable.id],
    }),
    columns: many(projectTemplateColumnTable),
    tasks: many(projectTemplateTaskTable),
  }),
);

export const projectTemplateColumnTableRelations = relations(
  projectTemplateColumnTable,
  ({ one }) => ({
    template: one(projectTemplateTable, {
      fields: [projectTemplateColumnTable.templateId],
      references: [projectTemplateTable.id],
    }),
  }),
);

export const projectTemplateTaskTableRelations = relations(
  projectTemplateTaskTable,
  ({ one }) => ({
    template: one(projectTemplateTable, {
      fields: [projectTemplateTaskTable.templateId],
      references: [projectTemplateTable.id],
    }),
  }),
);

export const workspaceUserTableRelations = relations(
  workspaceUserTable,
  ({ one }) => ({
    workspace: one(workspaceTable, {
      fields: [workspaceUserTable.workspaceId],
      references: [workspaceTable.id],
    }),
    user: one(userTable, {
      fields: [workspaceUserTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const projectTableRelations = relations(
  projectTable,
  ({ one, many }) => ({
    workspace: one(workspaceTable, {
      fields: [projectTable.workspaceId],
      references: [workspaceTable.id],
    }),
    tasks: many(taskTable),
    assets: many(assetTable),
    productSpecs: many(productSpecTable),
    columns: many(columnTable),
    workflowRules: many(workflowRuleTable),
    githubIntegration: many(githubIntegrationTable),
    integrations: many(integrationTable),
    notificationWorkspaceProjects: many(userNotificationWorkspaceProjectTable),
  }),
);

export const columnTableRelations = relations(columnTable, ({ one, many }) => ({
  project: one(projectTable, {
    fields: [columnTable.projectId],
    references: [projectTable.id],
  }),
  tasks: many(taskTable),
  workflowRules: many(workflowRuleTable),
}));

export const workflowRuleTableRelations = relations(
  workflowRuleTable,
  ({ one }) => ({
    project: one(projectTable, {
      fields: [workflowRuleTable.projectId],
      references: [projectTable.id],
    }),
    column: one(columnTable, {
      fields: [workflowRuleTable.columnId],
      references: [columnTable.id],
    }),
  }),
);

export const taskTableRelations = relations(taskTable, ({ one, many }) => ({
  project: one(projectTable, {
    fields: [taskTable.projectId],
    references: [projectTable.id],
  }),
  assignee: one(userTable, {
    fields: [taskTable.userId],
    references: [userTable.id],
  }),
  column: one(columnTable, {
    fields: [taskTable.columnId],
    references: [columnTable.id],
  }),
  timeEntries: many(timeEntryTable),
  activities: many(activityTable),
  comments: many(commentTable),
  assets: many(assetTable),
  labels: many(labelTable),
  customFieldValues: many(customFieldValueTable),
  externalLinks: many(externalLinkTable),
  sourceRelations: many(taskRelationTable, { relationName: "sourceTask" }),
  targetRelations: many(taskRelationTable, { relationName: "targetTask" }),
  remindersSent: many(taskReminderSentTable),
  approvals: many(taskApprovalTable),
}));

export const taskApprovalTableRelations = relations(
  taskApprovalTable,
  ({ one }) => ({
    task: one(taskTable, {
      fields: [taskApprovalTable.taskId],
      references: [taskTable.id],
    }),
  }),
);

export const timeEntryTableRelations = relations(timeEntryTable, ({ one }) => ({
  task: one(taskTable, {
    fields: [timeEntryTable.taskId],
    references: [taskTable.id],
  }),
  user: one(userTable, {
    fields: [timeEntryTable.userId],
    references: [userTable.id],
  }),
}));

export const activityTableRelations = relations(activityTable, ({ one }) => ({
  task: one(taskTable, {
    fields: [activityTable.taskId],
    references: [taskTable.id],
  }),
  user: one(userTable, {
    fields: [activityTable.userId],
    references: [userTable.id],
  }),
}));

export const assetTableRelations = relations(assetTable, ({ one, many }) => ({
  workspace: one(workspaceTable, {
    fields: [assetTable.workspaceId],
    references: [workspaceTable.id],
  }),
  project: one(projectTable, {
    fields: [assetTable.projectId],
    references: [projectTable.id],
  }),
  task: one(taskTable, {
    fields: [assetTable.taskId],
    references: [taskTable.id],
  }),
  activity: one(activityTable, {
    fields: [assetTable.activityId],
    references: [activityTable.id],
  }),
  creator: one(userTable, {
    fields: [assetTable.createdBy],
    references: [userTable.id],
  }),
  pins: many(imagePinTable),
  assetPins: many(assetPinTable),
  shareLinks: many(assetShareLinkTable),
  approvalEvents: many(assetApprovalEventTable),
  supersedesAsset: one(assetTable, {
    fields: [assetTable.supersedesAssetId],
    references: [assetTable.id],
    relationName: "assetRevision",
  }),
  supersededByAssets: many(assetTable, { relationName: "assetRevision" }),
}));

export const imagePinTableRelations = relations(imagePinTable, ({ one }) => ({
  asset: one(assetTable, {
    fields: [imagePinTable.assetId],
    references: [assetTable.id],
  }),
  task: one(taskTable, {
    fields: [imagePinTable.taskId],
    references: [taskTable.id],
  }),
  user: one(userTable, {
    fields: [imagePinTable.userId],
    references: [userTable.id],
  }),
}));

export const assetShareLinkTableRelations = relations(
  assetShareLinkTable,
  ({ one, many }) => ({
    asset: one(assetTable, {
      fields: [assetShareLinkTable.assetId],
      references: [assetTable.id],
    }),
    createdBy: one(userTable, {
      fields: [assetShareLinkTable.createdByUserId],
      references: [userTable.id],
    }),
    guests: many(assetGuestTable),
  }),
);

export const assetGuestTableRelations = relations(
  assetGuestTable,
  ({ one, many }) => ({
    shareLink: one(assetShareLinkTable, {
      fields: [assetGuestTable.shareLinkId],
      references: [assetShareLinkTable.id],
    }),
    pins: many(assetPinTable),
    notes: many(assetPinNoteTable),
  }),
);

export const assetPinTableRelations = relations(
  assetPinTable,
  ({ one, many }) => ({
    asset: one(assetTable, {
      fields: [assetPinTable.assetId],
      references: [assetTable.id],
    }),
    createdByUser: one(userTable, {
      fields: [assetPinTable.createdByUserId],
      references: [userTable.id],
    }),
    createdByGuest: one(assetGuestTable, {
      fields: [assetPinTable.createdByGuestId],
      references: [assetGuestTable.id],
    }),
    notes: many(assetPinNoteTable),
  }),
);

export const assetPinNoteTableRelations = relations(
  assetPinNoteTable,
  ({ one }) => ({
    pin: one(assetPinTable, {
      fields: [assetPinNoteTable.pinId],
      references: [assetPinTable.id],
    }),
    authorUser: one(userTable, {
      fields: [assetPinNoteTable.authorUserId],
      references: [userTable.id],
    }),
    authorGuest: one(assetGuestTable, {
      fields: [assetPinNoteTable.authorGuestId],
      references: [assetGuestTable.id],
    }),
  }),
);

export const assetApprovalEventTableRelations = relations(
  assetApprovalEventTable,
  ({ one }) => ({
    asset: one(assetTable, {
      fields: [assetApprovalEventTable.assetId],
      references: [assetTable.id],
    }),
    actorUser: one(userTable, {
      fields: [assetApprovalEventTable.actorUserId],
      references: [userTable.id],
    }),
    actorGuest: one(assetGuestTable, {
      fields: [assetApprovalEventTable.actorGuestId],
      references: [assetGuestTable.id],
    }),
  }),
);

export const productSpecTableRelations = relations(
  productSpecTable,
  ({ one }) => ({
    project: one(projectTable, {
      fields: [productSpecTable.projectId],
      references: [projectTable.id],
    }),
    imageAsset: one(assetTable, {
      fields: [productSpecTable.imageAssetId],
      references: [assetTable.id],
    }),
    linkedPin: one(assetPinTable, {
      fields: [productSpecTable.linkedPinId],
      references: [assetPinTable.id],
    }),
    createdByUser: one(userTable, {
      fields: [productSpecTable.createdByUserId],
      references: [userTable.id],
    }),
  }),
);

export const rfiTableRelations = relations(rfiTable, ({ one }) => ({
  project: one(projectTable, {
    fields: [rfiTable.projectId],
    references: [projectTable.id],
  }),
  assignee: one(userTable, {
    fields: [rfiTable.assigneeUserId],
    references: [userTable.id],
    relationName: "rfiAssignee",
  }),
  createdByUser: one(userTable, {
    fields: [rfiTable.createdByUserId],
    references: [userTable.id],
    relationName: "rfiCreatedBy",
  }),
  answeredByUser: one(userTable, {
    fields: [rfiTable.answeredByUserId],
    references: [userTable.id],
    relationName: "rfiAnsweredBy",
  }),
}));

export const changeOrderTableRelations = relations(
  changeOrderTable,
  ({ one }) => ({
    project: one(projectTable, {
      fields: [changeOrderTable.projectId],
      references: [projectTable.id],
    }),
    createdByUser: one(userTable, {
      fields: [changeOrderTable.createdByUserId],
      references: [userTable.id],
      relationName: "changeOrderCreatedBy",
    }),
    decidedByUser: one(userTable, {
      fields: [changeOrderTable.decidedByUserId],
      references: [userTable.id],
      relationName: "changeOrderDecidedBy",
    }),
  }),
);

export const submittalTableRelations = relations(submittalTable, ({ one }) => ({
  project: one(projectTable, {
    fields: [submittalTable.projectId],
    references: [projectTable.id],
  }),
  assignee: one(userTable, {
    fields: [submittalTable.assigneeUserId],
    references: [userTable.id],
    relationName: "submittalAssignee",
  }),
  supersedesSubmittal: one(submittalTable, {
    fields: [submittalTable.supersedesSubmittalId],
    references: [submittalTable.id],
    relationName: "submittalRevision",
  }),
  createdByUser: one(userTable, {
    fields: [submittalTable.createdByUserId],
    references: [userTable.id],
    relationName: "submittalCreatedBy",
  }),
  reviewedByUser: one(userTable, {
    fields: [submittalTable.reviewedByUserId],
    references: [userTable.id],
    relationName: "submittalReviewedBy",
  }),
}));

export const permitTableRelations = relations(permitTable, ({ one }) => ({
  project: one(projectTable, {
    fields: [permitTable.projectId],
    references: [projectTable.id],
  }),
  assignee: one(userTable, {
    fields: [permitTable.assigneeUserId],
    references: [userTable.id],
    relationName: "permitAssignee",
  }),
  createdByUser: one(userTable, {
    fields: [permitTable.createdByUserId],
    references: [userTable.id],
    relationName: "permitCreatedBy",
  }),
}));

export const labelTableRelations = relations(labelTable, ({ one }) => ({
  task: one(taskTable, {
    fields: [labelTable.taskId],
    references: [taskTable.id],
  }),
}));

export const customFieldDefinitionTableRelations = relations(
  customFieldDefinitionTable,
  ({ one, many }) => ({
    workspace: one(workspaceTable, {
      fields: [customFieldDefinitionTable.workspaceId],
      references: [workspaceTable.id],
    }),
    values: many(customFieldValueTable),
  }),
);

export const customFieldValueTableRelations = relations(
  customFieldValueTable,
  ({ one }) => ({
    field: one(customFieldDefinitionTable, {
      fields: [customFieldValueTable.fieldId],
      references: [customFieldDefinitionTable.id],
    }),
    task: one(taskTable, {
      fields: [customFieldValueTable.taskId],
      references: [taskTable.id],
    }),
  }),
);

export const notificationTableRelations = relations(
  notificationTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [notificationTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const userNotificationPreferenceTableRelations = relations(
  userNotificationPreferenceTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [userNotificationPreferenceTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const userNotificationWorkspaceRuleTableRelations = relations(
  userNotificationWorkspaceRuleTable,
  ({ one, many }) => ({
    user: one(userTable, {
      fields: [userNotificationWorkspaceRuleTable.userId],
      references: [userTable.id],
    }),
    workspace: one(workspaceTable, {
      fields: [userNotificationWorkspaceRuleTable.workspaceId],
      references: [workspaceTable.id],
    }),
    selectedProjects: many(userNotificationWorkspaceProjectTable),
  }),
);

export const userNotificationWorkspaceProjectTableRelations = relations(
  userNotificationWorkspaceProjectTable,
  ({ one }) => ({
    workspaceRule: one(userNotificationWorkspaceRuleTable, {
      fields: [
        userNotificationWorkspaceProjectTable.workspaceId,
        userNotificationWorkspaceProjectTable.workspaceRuleId,
      ],
      references: [
        userNotificationWorkspaceRuleTable.workspaceId,
        userNotificationWorkspaceRuleTable.id,
      ],
    }),
    project: one(projectTable, {
      fields: [
        userNotificationWorkspaceProjectTable.workspaceId,
        userNotificationWorkspaceProjectTable.projectId,
      ],
      references: [projectTable.workspaceId, projectTable.id],
    }),
  }),
);

export const githubIntegrationTableRelations = relations(
  githubIntegrationTable,
  ({ one }) => ({
    project: one(projectTable, {
      fields: [githubIntegrationTable.projectId],
      references: [projectTable.id],
    }),
  }),
);

export const teamTableRelations = relations(teamTable, ({ one, many }) => ({
  workspace: one(workspaceTable, {
    fields: [teamTable.workspaceId],
    references: [workspaceTable.id],
  }),
  teamMembers: many(teamMemberTable),
}));

export const teamMemberTableRelations = relations(
  teamMemberTable,
  ({ one }) => ({
    team: one(teamTable, {
      fields: [teamMemberTable.teamId],
      references: [teamTable.id],
    }),
    user: one(userTable, {
      fields: [teamMemberTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const invitationTableRelations = relations(
  invitationTable,
  ({ one }) => ({
    workspace: one(workspaceTable, {
      fields: [invitationTable.workspaceId],
      references: [workspaceTable.id],
    }),
    inviter: one(userTable, {
      fields: [invitationTable.inviterId],
      references: [userTable.id],
    }),
  }),
);

export const workspaceRoleTableRelations = relations(
  workspaceRoleTable,
  ({ one }) => ({
    workspace: one(workspaceTable, {
      fields: [workspaceRoleTable.workspaceId],
      references: [workspaceTable.id],
    }),
  }),
);

export const apikeyTableRelations = relations(apikeyTable, ({ one }) => ({
  user: one(userTable, {
    fields: [apikeyTable.referenceId],
    references: [userTable.id],
  }),
}));

export const integrationTableRelations = relations(
  integrationTable,
  ({ one, many }) => ({
    project: one(projectTable, {
      fields: [integrationTable.projectId],
      references: [projectTable.id],
    }),
    externalLinks: many(externalLinkTable),
  }),
);

export const taskRelationTableRelations = relations(
  taskRelationTable,
  ({ one }) => ({
    sourceTask: one(taskTable, {
      fields: [taskRelationTable.sourceTaskId],
      references: [taskTable.id],
      relationName: "sourceTask",
    }),
    targetTask: one(taskTable, {
      fields: [taskRelationTable.targetTaskId],
      references: [taskTable.id],
      relationName: "targetTask",
    }),
  }),
);

export const externalLinkTableRelations = relations(
  externalLinkTable,
  ({ one }) => ({
    task: one(taskTable, {
      fields: [externalLinkTable.taskId],
      references: [taskTable.id],
    }),
    integration: one(integrationTable, {
      fields: [externalLinkTable.integrationId],
      references: [integrationTable.id],
    }),
  }),
);

export const taskReminderSentTableRelations = relations(
  taskReminderSentTable,
  ({ one }) => ({
    task: one(taskTable, {
      fields: [taskReminderSentTable.taskId],
      references: [taskTable.id],
    }),
  }),
);

export const commentTableRelations = relations(commentTable, ({ one }) => ({
  task: one(taskTable, {
    fields: [commentTable.taskId],
    references: [taskTable.id],
  }),
  user: one(userTable, {
    fields: [commentTable.userId],
    references: [userTable.id],
  }),
}));
