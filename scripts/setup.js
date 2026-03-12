#!/usr/bin/env node
/**
 * One-time setup: authenticate via OTP and save your token to .env
 *
 * Usage:
 *   node scripts/setup.js
 *
 * What it does:
 *   1. Sends a one-time code to your email
 *   2. You paste the code
 *   3. Saves HULY_TOKEN + HULY_WORKSPACE to .env
 *
 * After setup, the MCP server and import script work without any manual token steps.
 */

'use strict'

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const { getClient } = require('@hcengineering/account-client')

const envFile = path.join(__dirname, '..', '.env')
const accountsUrl = process.env.HULY_ACCOUNTS_URL ?? 'https://account.huly.app'

function ask (question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()) }))
}

function writeEnv (token, workspace, accountsUrl) {
  const lines = [
    `HULY_WORKSPACE=${workspace}`,
    `HULY_TOKEN=${token}`,
    accountsUrl !== 'https://account.huly.app' ? `HULY_ACCOUNTS_URL=${accountsUrl}` : null
  ].filter(Boolean)

  // Merge with existing .env (don't overwrite unrelated vars)
  let existing = ''
  if (fs.existsSync(envFile)) {
    existing = fs.readFileSync(envFile, 'utf8')
  }

  const keep = existing.split('\n').filter(line => {
    const key = line.split('=')[0]
    return !['HULY_TOKEN', 'HULY_WORKSPACE', 'HULY_EMAIL', 'HULY_PASSWORD', 'HULY_ACCOUNTS_URL'].includes(key)
  })

  fs.writeFileSync(envFile, [...keep.filter(Boolean), ...lines].join('\n') + '\n')
}

async function main () {
  console.log('\n🔧  Huly MCP Setup\n')

  const email = await ask('  Email address (the one you use for huly.app): ')
  if (!email.includes('@')) { console.error('Invalid email.'); process.exit(1) }

  const workspace = await ask('  Workspace slug (e.g. "medics" from huly.app/medics): ')
  if (!workspace) { console.error('Workspace is required.'); process.exit(1) }

  console.log(`\n  Sending OTP to ${email}...`)
  const unauthClient = getClient(accountsUrl)
  await unauthClient.loginOtp(email)
  console.log('  ✅ Code sent!\n')

  const code = await ask('  Enter the 6-digit code from your email: ')

  console.log('\n  Validating...')
  const loginInfo = await unauthClient.validateOtp(email, code.trim())

  if (!loginInfo?.token) {
    console.error('  ❌ Invalid or expired code. Run setup again.')
    process.exit(1)
  }

  // Verify workspace is accessible
  const authedClient = getClient(accountsUrl, loginInfo.token)
  const wsInfo = await authedClient.selectWorkspace(workspace, 'external').catch(e => {
    console.error(`  ❌ Could not access workspace '${workspace}': ${e.message}`)
    process.exit(1)
  })

  if (!wsInfo?.endpoint) {
    console.error(`  ❌ Workspace '${workspace}' not found or not accessible.`)
    process.exit(1)
  }

  // Save token to .env
  writeEnv(loginInfo.token, workspace, accountsUrl)

  console.log(`\n  ✅ Setup complete!`)
  console.log(`     Workspace : ${workspace}`)
  console.log(`     Endpoint  : ${wsInfo.endpoint}`)
  console.log(`     Token saved to .env\n`)
  console.log('  You can now run:')
  console.log('    node scripts/import-csv.js your-tasks.csv PROJ\n')
}

main().catch(err => {
  console.error('\n❌ Setup failed:', err.message)
  process.exit(1)
})
