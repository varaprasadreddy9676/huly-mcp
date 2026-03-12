import tracker from '@hcengineering/tracker'
import chunter from '@hcengineering/chunter'
import { getConnection } from '../connection'
import { wrapToolHandler } from '../utils/errors'
import type { z } from 'zod'
import type { AddCommentSchema } from '../schemas'

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
