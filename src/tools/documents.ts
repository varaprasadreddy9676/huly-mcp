import document from '@hcengineering/document'
import { SortingOrder, type Ref } from '@hcengineering/core'
import { getConnection } from '../connection.js'
import { wrapToolHandler } from '../utils/errors.js'
import type { z } from 'zod'
import type { ListDocumentsSchema } from '../schemas.js'
import type { Teamspace } from '@hcengineering/document'

export const listTeamspaces = wrapToolHandler<Record<string, never>>(async () => {
  const client = await getConnection()
  const teamspaces = await client.findAll(document.class.Teamspace, {})

  if (teamspaces.length === 0) return 'No teamspaces found in this workspace.'

  const lines = teamspaces.map((t) =>
    `- **${t.name}** (id: \`${t._id}\`)${t.description != null && t.description !== '' ? `\n  ${t.description}` : ''}`
  )

  return `## Teamspaces (${teamspaces.length})\n\n${lines.join('\n')}`
})

export const listDocuments = wrapToolHandler<z.infer<typeof ListDocumentsSchema>>(async (args) => {
  const client = await getConnection()
  const docs = await client.findAll(
    document.class.Document,
    { space: args.teamspaceId as Ref<Teamspace> },
    { sort: { rank: SortingOrder.Ascending }, limit: 100 }
  )

  if (docs.length === 0) return 'No documents found in this teamspace.'

  const lines = docs.map((d) => `- **${d.title}** (id: \`${d._id}\`)`)
  return `## Documents (${docs.length})\n\n${lines.join('\n')}`
})
