import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { listProjects, getProject } from './tools/projects'
import { listIssues, getIssue, createIssue, updateIssue, deleteIssue } from './tools/issues'
import { addComment } from './tools/comments'
import { listMembers } from './tools/members'
import { listMilestones } from './tools/milestones'
import { listTeamspaces, listDocuments } from './tools/documents'
import { searchIssues } from './tools/search'
import { listLabels, createLabel, addLabel, removeLabel } from './tools/labels'
import { addRelation, addBlockedBy, setParent } from './tools/relations'
import {
  GetProjectSchema,
  ListIssuesSchema,
  GetIssueSchema,
  CreateIssueSchema,
  UpdateIssueSchema,
  DeleteIssueSchema,
  AddCommentSchema,
  ListMilestonesSchema,
  ListDocumentsSchema,
  SearchIssuesSchema,
  ListLabelsSchema,
  CreateLabelSchema,
  AddLabelSchema,
  RemoveLabelSchema,
  AddRelationSchema,
  AddBlockedBySchema,
  SetParentSchema
} from './schemas'

export function createServer (): McpServer {
  const server = new McpServer({ name: 'huly-mcp', version: '0.2.1' })

  // Projects
  server.tool('list_projects', 'List all projects in the Huly workspace', {}, listProjects)
  server.tool('get_project', 'Get a project by its identifier (e.g. "PROJ")', GetProjectSchema.shape, getProject)

  // Issues
  server.tool('list_issues', 'List issues in a project with optional filters', ListIssuesSchema.shape, listIssues)
  server.tool('get_issue', 'Get full details of an issue by identifier (e.g. "PROJ-123")', GetIssueSchema.shape, getIssue)
  server.tool('create_issue', 'Create a new issue in a project', CreateIssueSchema.shape, createIssue)
  server.tool('update_issue', 'Update an existing issue (title, status, priority, due date)', UpdateIssueSchema.shape, updateIssue)
  server.tool('delete_issue', 'Permanently delete an issue by identifier (e.g. "PROJ-123")', DeleteIssueSchema.shape, deleteIssue)

  // Comments
  server.tool('add_comment', 'Add a comment to an issue', AddCommentSchema.shape, addComment)

  // Labels
  server.tool('list_labels', 'List all labels in the workspace', ListLabelsSchema.shape, listLabels)
  server.tool('create_label', 'Create a new label with an optional hex color', CreateLabelSchema.shape, createLabel)
  server.tool('add_label', 'Add a label to an issue (auto-creates the label if it does not exist)', AddLabelSchema.shape, addLabel)
  server.tool('remove_label', 'Remove a label from an issue', RemoveLabelSchema.shape, removeLabel)

  // Relations
  server.tool('add_relation', 'Mark two issues as related to each other (bidirectional)', AddRelationSchema.shape, addRelation)
  server.tool('add_blocked_by', 'Mark an issue as blocked by another issue', AddBlockedBySchema.shape, addBlockedBy)
  server.tool('set_parent', 'Set or clear the parent (epic) of an issue', SetParentSchema.shape, setParent)

  // Members
  server.tool('list_members', 'List all members in the workspace', {}, listMembers)

  // Milestones
  server.tool('list_milestones', 'List milestones for a project', ListMilestonesSchema.shape, listMilestones)

  // Documents
  server.tool('list_teamspaces', 'List all document teamspaces in the workspace', {}, listTeamspaces)
  server.tool('list_documents', 'List documents in a teamspace', ListDocumentsSchema.shape, listDocuments)

  // Search
  server.tool('search_issues', 'Full-text search across all issues', SearchIssuesSchema.shape, searchIssues)

  return server
}
