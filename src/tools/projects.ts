import tracker from '@hcengineering/tracker'
import { getConnection } from '../connection'
import { wrapToolHandler } from '../utils/errors'
import type { z } from 'zod'
import type { GetProjectSchema } from '../schemas'

export const listProjects = wrapToolHandler<Record<string, never>>(async () => {
  const client = await getConnection()
  const projects = await client.findAll(tracker.class.Project, {})

  if (projects.length === 0) return 'No projects found in this workspace.'

  const lines = projects.map((p) =>
    `- **${p.identifier}** — ${p.name ?? '(no name)'}${p.description != null && p.description !== '' ? `\n  ${p.description}` : ''}`
  )
  return `## Projects (${projects.length})\n\n${lines.join('\n')}`
})

export const getProject = wrapToolHandler<z.infer<typeof GetProjectSchema>>(async (args) => {
  const client = await getConnection()
  const project = await client.findOne(tracker.class.Project, { identifier: args.identifier })
  if (project == null) throw new Error(`Project '${args.identifier}' not found.`)

  const statuses = await client.findAll(tracker.class.IssueStatus, { space: project._id })
  const statusList = statuses.map((s) => `  - ${s.name}`).join('\n')

  return [
    `## Project: ${project.identifier}`,
    `**Name:** ${project.name ?? '(no name)'}`,
    project.description != null && project.description !== '' ? `**Description:** ${project.description}` : null,
    `**Issues created:** ${project.sequence}`,
    `\n**Statuses:**\n${statusList}`
  ].filter(Boolean).join('\n')
})
