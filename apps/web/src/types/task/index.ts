type TaskLabel = {
  id: string;
  name: string;
  color: string;
};

type TaskExternalLink = {
  id: string;
  taskId: string;
  integrationId: string;
  resourceType: string;
  externalId: string;
  url: string;
  title: string | null;
  metadata: Record<string, unknown> | null;
};

export type TaskApproval = {
  id: string;
  clientName: string;
  status: string;
  note: string | null;
  respondedAt: string;
};

export type TaskImage = {
  id: string;
  url: string;
  filename: string;
  versionNumber: number;
};

type Task = {
  id: string;
  title: string;
  number: number | null;
  description: string | null;
  status: string;
  priority: string | null;
  startDate: string | null;
  dueDate: string | null;
  position: number | null;
  createdAt: string;
  updatedAt?: string;
  userId: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeImage?: string | null;
  projectId: string;
  columnId?: string | null;
  labels?: TaskLabel[];
  externalLinks?: TaskExternalLink[];
  approvalStatus?: string | null;
  approvalNote?: string | null;
  approvalClientName?: string | null;
  approvalRespondedAt?: string | null;
  approvals?: TaskApproval[];
  images?: TaskImage[];
};

export default Task;
