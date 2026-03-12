import { getAccountClient } from '../connection'
import { wrapToolHandler } from '../utils/errors'

export const listMembers = wrapToolHandler<Record<string, never>>(async () => {
  const accountClient = await getAccountClient()
  const members = await accountClient.getWorkspaceMembers()

  if (members.length === 0) return 'No members found in this workspace.'

  const lines = members.map((m) => {
    const role = String(m.role ?? 'member')
    return `- \`${m.person}\` — role: **${role}**`
  })

  return `## Workspace Members (${members.length})\n\n${lines.join('\n')}`
})
