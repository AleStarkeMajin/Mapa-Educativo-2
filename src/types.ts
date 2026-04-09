export const NodeStatus = {
  TODO: "todo",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
} as const;
export type NodeStatus = (typeof NodeStatus)[keyof typeof NodeStatus];

export const NodeType = {
  PARENT: "parent",
  CHILD: "child",
} as const;
export type NodeType = (typeof NodeType)[keyof typeof NodeType];

export const DiffStatus = {
  ADDED: "added",
  MODIFIED: "modified",
  DELETED: "deleted",
  NONE: "none",
} as const;
export type DiffStatus = (typeof DiffStatus)[keyof typeof DiffStatus];

export interface User {
  id: string;
  emailOrPhone: string;
  name: string;
  role: UserRole;
}

export interface MindMapNode {
  id: string;
  parentId: string | null;
  label: string;
  description: string;
  content?: string;
  type: NodeType;
  status: NodeStatus;
  prerequisites: string[];
  x?: number;
  y?: number;
  lastUpdated?: number;
}

export interface MapBranch {
  id: string;
  name: string;
  nodes: MindMapNode[];
  version: number;
  baseVersion?: number;
}

export interface PullRequest {
  id: string;
  userId: string;
  userName: string;
  nodes: MindMapNode[];
  timestamp: number;
  status: "pending" | "accepted" | "rejected";
}

export type UserRole = "owner" | "student";
