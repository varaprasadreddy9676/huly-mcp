import { getClient as getRawAccountClient, type AccountClient } from '@hcengineering/account-client'
import { type Client, TxOperations, type PersonId } from '@hcengineering/core'
import { createClient } from '@hcengineering/server-client'

interface ConnectionState {
  txClient: TxOperations
  rawConnection: Client
  accountClient: AccountClient
}

let state: ConnectionState | null = null
let connectPromise: Promise<ConnectionState> | null = null

export async function getConnection (): Promise<TxOperations> {
  if (state !== null) return state.txClient
  if (connectPromise !== null) return (await connectPromise).txClient
  connectPromise = connect()
  state = await connectPromise
  connectPromise = null
  return state.txClient
}

export async function getAccountClient (): Promise<AccountClient> {
  if (state !== null) return state.accountClient
  await getConnection()
  return state!.accountClient
}

async function connect (): Promise<ConnectionState> {
  const email = process.env.HULY_EMAIL
  const password = process.env.HULY_PASSWORD
  const workspaceUrl = process.env.HULY_WORKSPACE
  const accountsUrl = process.env.HULY_ACCOUNTS_URL ?? 'https://account.huly.app'

  if (email == null || password == null || workspaceUrl == null) {
    throw new Error('Missing required env vars: HULY_EMAIL, HULY_PASSWORD, HULY_WORKSPACE')
  }

  // Step 1: login → get token + socialId
  const unauthClient = getRawAccountClient(accountsUrl)
  const loginInfo = await unauthClient.login(email, password)

  if (loginInfo.token == null) {
    throw new Error('Login failed: no token returned. Check credentials.')
  }
  if (loginInfo.socialId == null) {
    throw new Error('Login failed: no socialId returned.')
  }

  // Step 2: select workspace → get WS endpoint + workspace token
  const authedAccountClient = getRawAccountClient(accountsUrl, loginInfo.token)
  const wsInfo = await authedAccountClient.selectWorkspace(workspaceUrl, 'external')

  if (wsInfo.endpoint == null || wsInfo.token == null) {
    throw new Error(`Workspace '${workspaceUrl}' not found or not accessible.`)
  }

  // Step 3: open WebSocket connection
  const rawConnection = await createClient(wsInfo.endpoint, wsInfo.token)
  const txClient = new TxOperations(rawConnection, loginInfo.socialId as PersonId)

  // Build workspace-scoped account client for member lookups
  const accountClient = getRawAccountClient(accountsUrl, wsInfo.token)

  return { txClient, rawConnection, accountClient }
}

export async function closeConnection (): Promise<void> {
  if (state !== null) {
    await state.rawConnection.close()
    state = null
  }
}
