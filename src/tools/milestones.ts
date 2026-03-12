import tracker from '@hcengineering/tracker'
import { getConnection } from '../connection'
import { wrapToolHandler } from '../utils/errors'
import { MILESTONE_STATUS_LABELS, formatDate } from '../utils/format'
import type { z } from 'zod'
import type { ListMilestonesSchema } from '../schemas'

export const listMilestones = wrapToolHandler<z.infer<typeof ListMilestonesSchema>>(async (args) => {
  const client = await getConnection()
  const project = await client.findOne(tracker.class.Project, { identifier: args.projectIdentifier })
  if (project == null) throw new Error(`Project '${args.projectIdentifier}' not found.`)

  const milestones = await client.findAll(tracker.class.Milestone, { space: project._id })

  if (milestones.length === 0) return `No milestones found in project ${args.projectIdentifier}.`

  const lines = milestones.map((m) => {
    const status = MILESTONE_STATUS_LABELS[m.status as number] ?? 'Unknown'
    const target = formatDate(m.targetDate)
    return `- **${m.label}** [${status}] — Target: ${target}`
  })

  return `## Milestones in ${args.projectIdentifier} (${milestones.length})\n\n${lines.join('\n')}`
})
