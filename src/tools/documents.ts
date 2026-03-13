import document from '@hcengineering/document'
import { SortingOrder, generateId, type Ref } from '@hcengineering/core'
import { getFirstRank } from '@hcengineering/document'
import { getConnection, getWorkspaceInfo } from '../connection'
import { wrapToolHandler } from '../utils/errors'
import type { z } from 'zod'
import type { ListDocumentsSchema, GetDocumentSchema, CreateDocumentSchema } from '../schemas'
import type { Teamspace, Document } from '@hcengineering/document'

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

  // Build parent-child tree display
  const noParentId = document.ids.NoParent as string
  const lines = docs.map((d) => {
    const isNested = d.parent != null && String(d.parent) !== noParentId
    const prefix = isNested ? '  - ' : '- '
    return `${prefix}**${d.title}** (id: \`${d._id}\`)${d.snapshots != null && d.snapshots > 0 ? ` [${d.snapshots} snapshots]` : ''}`
  })
  return `## Documents (${docs.length})\n\n${lines.join('\n')}`
})

export const getDocument = wrapToolHandler<z.infer<typeof GetDocumentSchema>>(async (args) => {
  const client = await getConnection()
  const doc = await client.findOne(document.class.Document, { _id: args.documentId as Ref<Document> })
  if (doc == null) throw new Error(`Document '${args.documentId}' not found.`)

  const teamspace = await client.findOne(document.class.Teamspace, { _id: doc.space })

  const lines = [
    `## ${doc.title}`,
    `**ID:** \`${doc._id}\``,
    `**Teamspace:** ${teamspace?.name ?? doc.space}`,
    `**Comments:** ${doc.comments ?? 0}`,
    `**Attachments:** ${doc.attachments ?? 0}`,
    `**Snapshots:** ${doc.snapshots ?? 0}`
  ]

  // Provide content access instructions if content blob ref exists
  if (doc.content != null) {
    const frontUrl = process.env.HULY_FRONT_URL
    if (frontUrl != null && frontUrl !== '') {
      const { wsToken, workspaceUuid } = await getWorkspaceInfo()
      const blobUrl = `${frontUrl}/files?file=${encodeURIComponent(doc.content)}&workspace=${workspaceUuid}&token=${wsToken}`
      lines.push(`\n**Content:** Available at blob ref \`${doc.content}\``)
      lines.push(`**Content URL:** ${blobUrl}`)
      // Try to fetch content
      try {
        const res = await fetch(blobUrl)
        if (res.ok) {
          const text = await res.text()
          // Huly stores content as JSON markup — extract plain text if possible
          try {
            const parsed = JSON.parse(text)
            const extracted = extractText(parsed)
            if (extracted.length > 0) {
              lines.push(`\n**Content:**\n${extracted}`)
            }
          } catch {
            lines.push(`\n**Content (raw):**\n${text.substring(0, 2000)}`)
          }
        }
      } catch {
        lines.push(`_(Set HULY_FRONT_URL env var to fetch content)_`)
      }
    } else {
      lines.push(`\n**Content blob ref:** \`${doc.content}\``)
      lines.push(`_(Set HULY_FRONT_URL env var to fetch document content, e.g. https://front.huly.app)_`)
    }
  } else {
    lines.push('\n**Content:** _(empty document)_')
  }

  return lines.join('\n')
})

export const createDocument = wrapToolHandler<z.infer<typeof CreateDocumentSchema>>(async (args) => {
  const client = await getConnection()

  const teamspace = await client.findOne(document.class.Teamspace, { _id: args.teamspaceId as Ref<Teamspace> })
  if (teamspace == null) throw new Error(`Teamspace '${args.teamspaceId}' not found.`)

  const noParent = document.ids.NoParent as Ref<Document>
  const parentId = args.parentId != null ? (args.parentId as Ref<Document>) : noParent

  // Compute rank (prepend before existing docs at same level)
  const rank = await getFirstRank(client, teamspace._id, parentId)

  const docId = generateId<Document>()
  await client.createDoc(
    document.class.Document,
    teamspace._id,
    {
      title: args.title,
      content: null,
      parent: parentId,
      rank: rank ?? '',
      icon: null,
      color: undefined as any,
      snapshots: 0,
      attachments: 0,
      comments: 0,
      labels: 0,
      references: 0,
      embeddings: 0
    } as any,
    docId
  )

  return `✅ Document **"${args.title}"** created (id: \`${docId}\`) in teamspace "${teamspace.name}".\nOpen it in Huly to add content via the editor.`
})

// Helper: extract plain text from Huly's ProseMirror JSON markup
function extractText (node: any): string {
  if (typeof node === 'string') return node
  if (node == null || typeof node !== 'object') return ''
  if (node.type === 'text' && typeof node.text === 'string') return node.text
  const children: any[] = node.content ?? node.children ?? []
  return children.map(extractText).join(node.type === 'paragraph' || node.type === 'heading' ? '\n' : '')
}
