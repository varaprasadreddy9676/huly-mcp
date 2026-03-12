import { z } from 'zod'

const PriorityEnum = z.enum(['NoPriority', 'Urgent', 'High', 'Medium', 'Low'])

export const GetProjectSchema = z.object({
  identifier: z.string().describe('Project identifier, e.g. "PROJ"')
})

export const ListIssuesSchema = z.object({
  projectIdentifier: z.string().describe('Project identifier, e.g. "PROJ"'),
  status: z.string().optional().describe('Filter by status name, e.g. "In Progress"'),
  priority: PriorityEnum.optional().describe('Filter by priority'),
  limit: z.number().int().min(1).max(250).default(50).describe('Max issues to return')
})

export const GetIssueSchema = z.object({
  identifier: z.string().describe('Issue identifier, e.g. "PROJ-123"')
})

export const CreateIssueSchema = z.object({
  projectIdentifier: z.string().describe('Project identifier, e.g. "PROJ"'),
  title: z.string().min(1).describe('Issue title'),
  priority: PriorityEnum.default('NoPriority').describe('Issue priority'),
  statusName: z.string().optional().describe('Status name (defaults to project default)'),
  dueDate: z.string().optional().describe('Due date as ISO 8601 string, e.g. "2026-04-01"')
})

export const UpdateIssueSchema = z.object({
  identifier: z.string().describe('Issue identifier, e.g. "PROJ-123"'),
  title: z.string().optional().describe('New title'),
  statusName: z.string().optional().describe('New status name'),
  priority: PriorityEnum.optional().describe('New priority'),
  dueDate: z.string().nullable().optional().describe('New due date (ISO 8601) or null to clear')
})

export const AddCommentSchema = z.object({
  identifier: z.string().describe('Issue identifier, e.g. "PROJ-123"'),
  message: z.string().min(1).describe('Comment text')
})

export const ListMilestonesSchema = z.object({
  projectIdentifier: z.string().describe('Project identifier, e.g. "PROJ"')
})

export const ListDocumentsSchema = z.object({
  teamspaceId: z.string().describe('Teamspace _id from list_teamspaces')
})

export const SearchIssuesSchema = z.object({
  query: z.string().min(1).describe('Search query'),
  limit: z.number().int().min(1).max(50).default(20).describe('Max results')
})

// ── Labels ────────────────────────────────────────────────────────────────────
export const ListLabelsSchema = z.object({
  projectIdentifier: z.string().optional().describe('Optional project filter (currently returns all workspace labels)')
})

export const CreateLabelSchema = z.object({
  title: z.string().min(1).describe('Label name'),
  color: z.string().optional().describe('Hex color, e.g. "#FF6B6B" (optional)')
})

export const AddLabelSchema = z.object({
  identifier: z.string().describe('Issue identifier, e.g. "PROJ-123"'),
  labelName: z.string().min(1).describe('Label name to add (auto-created if it does not exist)')
})

export const RemoveLabelSchema = z.object({
  identifier: z.string().describe('Issue identifier, e.g. "PROJ-123"'),
  labelName: z.string().min(1).describe('Label name to remove')
})

// ── Relations ─────────────────────────────────────────────────────────────────
export const AddRelationSchema = z.object({
  identifier: z.string().describe('Issue identifier, e.g. "PROJ-123"'),
  relatedTo: z.string().describe('Related issue identifier, e.g. "PROJ-456"')
})

export const AddBlockedBySchema = z.object({
  identifier: z.string().describe('Issue that is blocked, e.g. "PROJ-123"'),
  blockedBy: z.string().describe('Issue that blocks it, e.g. "PROJ-100"')
})

export const SetParentSchema = z.object({
  identifier: z.string().describe('Child issue identifier, e.g. "PROJ-123"'),
  parentIdentifier: z.string().nullable().optional().describe('Parent issue identifier, or null to clear parent')
})
