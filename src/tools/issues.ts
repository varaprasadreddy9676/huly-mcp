import tracker, { IssuePriority, type Issue } from '@hcengineering/tracker'
import task from '@hcengineering/task'
import { SortingOrder, generateId, type Ref, type DocumentUpdate } from '@hcengineering/core'
import { makeRank } from '@hcengineering/rank'
import { getConnection } from '../connection'
import { wrapToolHandler } from '../utils/errors'
import { priorityLabel, formatDate } from '../utils/format'
import type { z } from 'zod'
import type {
  ListIssuesSchema,
  GetIssueSchema,
  CreateIssueSchema,
  UpdateIssueSchema
} from '../schemas'

export const listIssues = wrapToolHandler<z.infer<typeof ListIssuesSchema>>(async (args) => {
  const client = await getConnection()
  const project = await client.findOne(tracker.class.Project, { identifier: args.projectIdentifier })
  if (project == null) throw new Error(`Project '${args.projectIdentifier}' not found.`)

  const query: Record<string, unknown> = { space: project._id }

  if (args.status != null) {
    const status = await client.findOne(tracker.class.IssueStatus, { space: project._id, name: args.status })
    if (status == null) throw new Error(`Status '${args.status}' not found in project '${args.projectIdentifier}'.`)
    query.status = status._id
  }

  if (args.priority != null) {
    query.priority = IssuePriority[args.priority as keyof typeof IssuePriority]
  }

  const issues = await client.findAll(
    tracker.class.Issue,
    query as any,
    { limit: args.limit, sort: { modifiedOn: SortingOrder.Descending } }
  )

  if (issues.length === 0) return `No issues found in project ${args.projectIdentifier}.`

  // Resolve all statuses in one call
  const statuses = await client.findAll(tracker.class.IssueStatus, { space: project._id })
  const statusMap = new Map(statuses.map((s) => [s._id, s.name]))

  const lines = issues.map((issue) => {
    const statusName = statusMap.get(issue.status) ?? 'Unknown'
    const due = issue.dueDate != null ? ` | Due: ${formatDate(issue.dueDate)}` : ''
    return `- **${issue.identifier}** [${statusName}] [${priorityLabel(issue.priority)}]${due}\n  ${issue.title}`
  })

  return `## Issues in ${args.projectIdentifier} (${issues.length})\n\n${lines.join('\n')}`
})

export const getIssue = wrapToolHandler<z.infer<typeof GetIssueSchema>>(async (args) => {
  const client = await getConnection()
  const issue = await client.findOne(tracker.class.Issue, { identifier: args.identifier })
  if (issue == null) throw new Error(`Issue '${args.identifier}' not found.`)

  const status = await client.findOne(tracker.class.IssueStatus, { _id: issue.status })

  return [
    `## ${issue.identifier}: ${issue.title}`,
    `**Status:** ${status?.name ?? 'Unknown'}`,
    `**Priority:** ${priorityLabel(issue.priority)}`,
    `**Due date:** ${formatDate(issue.dueDate)}`,
    `**Comments:** ${issue.comments ?? 0}`,
    `**Sub-issues:** ${issue.subIssues ?? 0}`,
    `**Estimation:** ${issue.estimation > 0 ? `${issue.estimation}h` : 'None'}`,
    `**Reported time:** ${issue.reportedTime > 0 ? `${issue.reportedTime}h` : 'None'}`
  ].join('\n')
})

export const createIssue = wrapToolHandler<z.infer<typeof CreateIssueSchema>>(async (args) => {
  const client = await getConnection()

  // 1. Find project
  const project = await client.findOne(tracker.class.Project, { identifier: args.projectIdentifier })
  if (project == null) throw new Error(`Project '${args.projectIdentifier}' not found.`)

  // 2. Increment sequence counter
  const incResult = await client.updateDoc(
    tracker.class.Project,
    project.space,
    project._id,
    { $inc: { sequence: 1 } } as any,
    true
  )
  const issueNumber: number = (incResult as any)?.object?.sequence ?? project.sequence + 1
  const identifier = `${project.identifier}-${issueNumber}`

  // 3. Resolve status
  const statuses = await client.findAll(tracker.class.IssueStatus, { space: project._id })
  const status = args.statusName != null
    ? (statuses.find((s) => s.name === args.statusName) ?? statuses[0])
    : (project.defaultIssueStatus != null
        ? (statuses.find((s) => s._id === project.defaultIssueStatus) ?? statuses[0])
        : statuses[0])
  if (status == null) throw new Error(`No statuses found in project '${args.projectIdentifier}'.`)

  // 4. Find TaskType (kind field — required)
  const kind = await client.findOne(task.class.TaskType, project.type != null ? { parent: project.type } : {})
  if (kind == null) throw new Error('Could not find a TaskType for this project.')

  // 5. Compute rank (append after last issue)
  const lastIssue = await client.findOne(
    tracker.class.Issue,
    { space: project._id },
    { sort: { rank: SortingOrder.Descending } }
  )
  const rank = makeRank(lastIssue?.rank, undefined)

  // 6. Create via addCollection (issues are AttachedDoc)
  const issueId = generateId<Issue>()
  await client.addCollection(
    tracker.class.Issue,
    project._id,
    tracker.ids.NoParent,
    tracker.class.Issue,
    'subIssues',
    {
      title: args.title,
      description: null,
      status: status._id,
      priority: IssuePriority[args.priority as keyof typeof IssuePriority],
      number: issueNumber,
      identifier,
      rank,
      kind: kind._id,
      comments: 0,
      subIssues: 0,
      dueDate: args.dueDate != null ? new Date(args.dueDate).getTime() : null,
      assignee: null,
      component: null,
      milestone: null,
      parents: [],
      remainingTime: 0,
      estimation: 0,
      reportedTime: 0,
      reports: 0,
      childInfo: [],
      relations: []
    },
    issueId
  )

  return `✅ Created **${identifier}**: ${args.title}\nStatus: ${status.name} | Priority: ${priorityLabel(IssuePriority[args.priority as keyof typeof IssuePriority])}`
})

export const updateIssue = wrapToolHandler<z.infer<typeof UpdateIssueSchema>>(async (args) => {
  const client = await getConnection()
  const issue = await client.findOne(tracker.class.Issue, { identifier: args.identifier })
  if (issue == null) throw new Error(`Issue '${args.identifier}' not found.`)

  const updates: DocumentUpdate<Issue> = {}

  if (args.title != null) updates.title = args.title

  if (args.statusName != null) {
    const status = await client.findOne(tracker.class.IssueStatus, { space: issue.space, name: args.statusName })
    if (status == null) throw new Error(`Status '${args.statusName}' not found.`)
    updates.status = status._id
  }

  if (args.priority != null) {
    updates.priority = IssuePriority[args.priority as keyof typeof IssuePriority]
  }

  if (args.dueDate !== undefined) {
    updates.dueDate = args.dueDate != null ? new Date(args.dueDate).getTime() : null
  }

  if (Object.keys(updates).length === 0) return `No changes made to ${args.identifier}.`

  await client.updateDoc(tracker.class.Issue, issue.space, issue._id, updates)

  const changed = Object.keys(updates).join(', ')
  return `✅ Updated **${args.identifier}** — changed: ${changed}`
})
