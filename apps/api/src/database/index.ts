import { config } from "dotenv-mono";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  accountTableRelations,
  activityTableRelations,
  apikeyTableRelations,
  assetApprovalEventTableRelations,
  assetGuestTableRelations,
  assetPinNoteTableRelations,
  assetPinTableRelations,
  assetShareLinkTableRelations,
  assetTableRelations,
  changeOrderTableRelations,
  columnTableRelations,
  commentTableRelations,
  customFieldDefinitionTableRelations,
  customFieldValueTableRelations,
  externalLinkTableRelations,
  githubIntegrationTableRelations,
  imagePinTableRelations,
  integrationTableRelations,
  invitationTableRelations,
  labelTableRelations,
  notificationTableRelations,
  permitTableRelations,
  productSpecTableRelations,
  projectTableRelations,
  projectTemplateColumnTableRelations,
  projectTemplateTableRelations,
  projectTemplateTaskTableRelations,
  rfiTableRelations,
  sessionTableRelations,
  submittalTableRelations,
  taskApprovalTableRelations,
  taskRelationTableRelations,
  taskTableRelations,
  teamMemberTableRelations,
  teamTableRelations,
  timeEntryTableRelations,
  userNotificationPreferenceTableRelations,
  userNotificationWorkspaceProjectTableRelations,
  userNotificationWorkspaceRuleTableRelations,
  userTableRelations,
  verificationTableRelations,
  workflowRuleTableRelations,
  workspaceRoleTableRelations,
  workspaceTableRelations,
  workspaceUserTableRelations,
} from "./relations";
import { resolveDatabaseConnectionString } from "./resolve-database-url";
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
  billingChargeTable,
  billingEventTable,
  billingReminderSentTable,
  changeOrderTable,
  columnTable,
  commentTable,
  customFieldDefinitionTable,
  customFieldValueTable,
  deviceCodeTable,
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
  workspaceBillingTable,
  workspaceRoleTable,
  workspaceTable,
  workspaceUserTable,
} from "./schema";

config();

export const schema = {
  accountTable,
  assetTable,
  assetGuestTable,
  assetPinTable,
  assetPinNoteTable,
  assetShareLinkTable,
  assetApprovalEventTable,
  activityTable,
  apikeyTable,
  billingChargeTable,
  billingReminderSentTable,
  billingEventTable,
  workspaceBillingTable,
  changeOrderTable,
  columnTable,
  commentTable,
  customFieldDefinitionTable,
  customFieldValueTable,
  deviceCodeTable,
  externalLinkTable,
  githubIntegrationTable,
  imagePinTable,
  integrationTable,
  invitationTable,
  labelTable,
  notificationTable,
  productSpecTable,
  projectTable,
  projectTemplateColumnTable,
  projectTemplateTable,
  projectTemplateTaskTable,
  sessionTable,
  rfiTable,
  submittalTable,
  permitTable,
  taskApprovalTable,
  taskRelationTable,
  taskTable,
  teamMemberTable,
  teamTable,
  timeEntryTable,
  userTable,
  userNotificationPreferenceTable,
  userNotificationWorkspaceProjectTable,
  userNotificationWorkspaceRuleTable,
  verificationTable,
  workflowRuleTable,
  workspaceRoleTable,
  workspaceTable,
  workspaceUserTable,
  accountTableRelations,
  assetTableRelations,
  assetGuestTableRelations,
  assetPinTableRelations,
  assetPinNoteTableRelations,
  assetShareLinkTableRelations,
  assetApprovalEventTableRelations,
  activityTableRelations,
  apikeyTableRelations,
  changeOrderTableRelations,
  columnTableRelations,
  commentTableRelations,
  customFieldDefinitionTableRelations,
  customFieldValueTableRelations,
  externalLinkTableRelations,
  githubIntegrationTableRelations,
  imagePinTableRelations,
  integrationTableRelations,
  invitationTableRelations,
  labelTableRelations,
  notificationTableRelations,
  productSpecTableRelations,
  projectTableRelations,
  projectTemplateColumnTableRelations,
  projectTemplateTableRelations,
  projectTemplateTaskTableRelations,
  sessionTableRelations,
  rfiTableRelations,
  submittalTableRelations,
  permitTableRelations,
  taskApprovalTableRelations,
  taskRelationTableRelations,
  taskTableRelations,
  teamMemberTableRelations,
  teamTableRelations,
  timeEntryTableRelations,
  userTableRelations,
  userNotificationPreferenceTableRelations,
  userNotificationWorkspaceProjectTableRelations,
  userNotificationWorkspaceRuleTableRelations,
  verificationTableRelations,
  workflowRuleTableRelations,
  workspaceRoleTableRelations,
  workspaceTableRelations,
  workspaceUserTableRelations,
};

type DatabaseInstance = ReturnType<typeof drizzle<typeof schema>>;

let pool: Pool | undefined;
let dbInstance: DatabaseInstance | undefined;

export function getDatabasePool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: resolveDatabaseConnectionString(),
      // Fail fast when Railway's internal network is slow rather than hanging
      // indefinitely and blocking every API request.
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
      max: 10,
    });
  }

  return pool;
}

export function getDatabase(): DatabaseInstance {
  if (!dbInstance) {
    dbInstance = drizzle(getDatabasePool(), {
      schema,
    });
  }

  return dbInstance;
}

const db = new Proxy({} as DatabaseInstance, {
  get(_target, property, receiver) {
    const value = Reflect.get(getDatabase(), property, receiver);

    if (typeof value === "function") {
      return value.bind(getDatabase());
    }

    return value;
  },
});

export default db;
