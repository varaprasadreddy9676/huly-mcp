import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { listProjects, getProject } from './tools/projects.js'
import { listIssues, getIssue, createIssue, updateIssue } from './tools/issues.js'
import { addComment } from './tools/comments.js'
import { listMembers } from './tools/members.js'
import { listMilestones } from './tools/milestones.js'
import { listTeamspaces, listDocuments } from './tools/documents.js'
import { searchIssues } from './tools/search.js'
import {
  GetProjectSchema,
  ListIssuesSchema,
  GetIssueSchema,
  CreateIssueSchema,
  UpdateIssueSchema,
  AddCommentSchema,
  ListMilestonesSchema,
  ListDocumentsSchema,
  SearchIssuesSchema
} from './schemas.js'

export function createServer (): McpServer {
  const server = new McpServer({ name: 'huly-mcp', version: '0.1.0' })

  // Projects
  server.tool('list_projects', 'List all projects in the Huly workspace', {}, listProjects)
  server.tool('get_project', 'Get a project by its identifier (e.g. "PROJ")', GetProjectSchema.shape, getProject)

  // Issues
  server.tool('list_issues', 'List issues in a project with optional filters', ListIssuesSchema.shape, listIssues)
  server.tool('get_issue', 'Get full details of an issue by identifier (e.g. "PROJ-123")', GetIssueSchema.shape, getIssue)
  server.tool('create_issue', 'Create a new issue in a project', CreateIssueSchema.shape, createIssue)
  server.tool('update_issue', 'Update an existing issue (title, status, priority, due date)', UpdateIssueSchema.shape, updateIssue)

  // Comments
  server.tool('add_comment', 'Add a comment to an issue', AddCommentSchema.shape, addComment)

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
