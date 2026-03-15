import tracker from '@hcengineering/tracker'
import chunter from '@hcengineering/chunter'
import contact from '@hcengineering/contact'
import { getConnection } from '../connection'
import { wrapToolHandler } from '../utils/errors'
import { formatDate } from '../utils/format'
import type { z } from 'zod'
import type { AddCommentSchema, ListCommentsSchema } from '../schemas'
import { SortingOrder } from '@hcengineering/core'

export const addComment = wrapToolHandler<z.infer<typeof AddCommentSchema>>(async (args) => {
  const client = await getConnection()
  const issue = await client.findOne(tracker.class.Issue, { identifier: args.identifier })
  if (issue == null) throw new Error(`Issue '${args.identifier}' not found.`)

  await client.addCollection(
    chunter.class.ChatMessage,
    issue.space,
    issue._id,
    tracker.class.Issue,
    'comments',
    { message: args.message }
  )

  return `✅ Comment added to **${args.identifier}**.`
})

export const listComments = wrapToolHandler<z.infer<typeof ListCommentsSchema>>(async (args) => {
  const client = await getConnection()
  const issue = await client.findOne(tracker.class.Issue, { identifier: args.identifier })
  if (issue == null) throw new Error(`Issue '${args.identifier}' not found.`)

  const comments = await client.findAll(
    chunter.class.ChatMessage,
    { attachedTo: issue._id },
    { limit: args.limit, sort: { createdOn: SortingOrder.Ascending } }
  )

  if (comments.length === 0) return `No comments found on **${args.identifier}**.`

  // Filter comments with valid authors
  const commentsWithAuthors = comments.filter((c): c is typeof c & { createdBy: string } => c.createdBy != null)

  // Resolve author details
  const authorIds = [...new Set(commentsWithAuthors.map((c) => c.createdBy as unknown as string))]
  const members = authorIds.length > 0
    ? await client.findAll(contact.class.Member, { _id: { $in: authorIds as any[] } as any })
    : []
  const memberMap = new Map(members.map((m) => [m._id, (m as any).name ?? m._id]))

  const lines = commentsWithAuthors.map((comment) => {
    const author = memberMap.get(comment.createdBy as unknown as any) ?? 'Unknown'
    const date = formatDate(comment.createdOn)
    const message = (comment.message as string) ?? ''
    return `**${author}** @ ${date}:\n> ${message.split('\n').join('\n> ')}`
  })

  return `## Comments on ${args.identifier} (${comments.length})\n\n${lines.join('\n\n')}`
})
