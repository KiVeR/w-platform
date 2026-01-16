#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * CLI tool for user management
 *
 * Usage:
 *   yarn user create --email admin@test.com --password Test1234 --role ADMIN
 *   yarn user list
 *   yarn user delete --email user@test.com
 *   yarn user update --email user@test.com --role EDITOR
 *   yarn user reset-password --email user@test.com --password NewPass123
 *   yarn user seed
 */

import process from 'node:process'
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { defineCommand, runMain } from 'citty'

const prisma = new PrismaClient()
const SALT_ROUNDS = 12

// ANSI colors
const c = {
  reset: '\x1B[0m',
  bold: '\x1B[1m',
  red: '\x1B[31m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  cyan: '\x1B[36m',
  gray: '\x1B[90m',
}

const log = {
  success: (msg: string) => console.log(`${c.green}✓ ${msg}${c.reset}`),
  error: (msg: string) => console.log(`${c.red}✗ ${msg}${c.reset}`),
  info: (msg: string) => console.log(`${c.blue}ℹ ${msg}${c.reset}`),
  warn: (msg: string) => console.log(`${c.yellow}⚠ ${msg}${c.reset}`),
}

// Helpers
function validatePassword(password: string): { valid: boolean, message?: string } {
  if (password.length < 8)
    return { valid: false, message: 'Password must be at least 8 characters' }
  if (!/[A-Z]/.test(password))
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  if (!/[a-z]/.test(password))
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  if (!/\d/.test(password))
    return { valid: false, message: 'Password must contain at least one digit' }
  return { valid: true }
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email)
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 19)
}

function parseRole(role: string): Role {
  const r = role.toUpperCase() as Role
  if (!Object.values(Role).includes(r)) {
    throw new Error(`Invalid role. Must be one of: ${Object.values(Role).join(', ')}`)
  }
  return r
}

// Subcommands
const create = defineCommand({
  meta: {
    name: 'create',
    description: 'Create a new user',
  },
  args: {
    email: {
      type: 'string',
      description: 'User email address',
      required: true,
    },
    password: {
      type: 'string',
      description: 'Password (8+ chars, 1 upper, 1 lower, 1 digit)',
      required: true,
    },
    role: {
      type: 'string',
      description: 'User role: ADMIN, EDITOR, or VIEWER',
      default: 'EDITOR',
    },
    firstName: {
      type: 'string',
      description: 'First name',
    },
    lastName: {
      type: 'string',
      description: 'Last name',
    },
  },
  async run({ args }) {
    const { email, password, role, firstName, lastName } = args

    if (!validateEmail(email)) {
      log.error('Invalid email format')
      process.exit(1)
    }

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) {
      log.error(passwordCheck.message!)
      process.exit(1)
    }

    const userRole = parseRole(role)

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      log.error(`User with email ${email} already exists`)
      process.exit(1)
    }

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: await hashPassword(password),
        role: userRole,
        firstName: firstName || null,
        lastName: lastName || null,
        isActive: true,
      },
    })

    log.success('User created successfully!')
    console.log(`\n  ${c.gray}ID:${c.reset}        ${user.id}`)
    console.log(`  ${c.gray}Email:${c.reset}     ${user.email}`)
    console.log(`  ${c.gray}Role:${c.reset}      ${user.role}`)
    if (user.firstName || user.lastName) {
      console.log(`  ${c.gray}Name:${c.reset}      ${[user.firstName, user.lastName].filter(Boolean).join(' ')}`)
    }
    console.log(`  ${c.gray}Created:${c.reset}   ${formatDate(user.createdAt)}`)

    await prisma.$disconnect()
  },
})

const list = defineCommand({
  meta: {
    name: 'list',
    description: 'List all users',
  },
  args: {
    role: {
      type: 'string',
      description: 'Filter by role: ADMIN, EDITOR, or VIEWER',
    },
    active: {
      type: 'boolean',
      description: 'Filter by active status',
    },
  },
  async run({ args }) {
    const where: Record<string, unknown> = {}

    if (args.role) {
      where.role = parseRole(args.role)
    }
    if (args.active !== undefined) {
      where.isActive = args.active
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    if (users.length === 0) {
      log.info('No users found')
      await prisma.$disconnect()
      return
    }

    console.log(`\n${c.bold}Users (${users.length})${c.reset}`)
    console.log('─'.repeat(90))
    console.log(
      `${c.gray}${'ID'.padEnd(6)}${'Email'.padEnd(30)}${'Name'.padEnd(20)}${'Role'.padEnd(10)}${'Active'.padEnd(8)}Created${c.reset}`,
    )
    console.log('─'.repeat(90))

    for (const user of users) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || '-'
      const active = user.isActive ? `${c.green}Yes${c.reset}` : `${c.red}No${c.reset}`
      const roleColor = user.role === 'ADMIN' ? c.yellow : user.role === 'EDITOR' ? c.cyan : c.gray

      console.log(
        `${String(user.id).padEnd(6)}${user.email.padEnd(30)}${name.slice(0, 18).padEnd(20)}${roleColor}${user.role.padEnd(10)}${c.reset}${active.padEnd(17)}${formatDate(user.createdAt).slice(0, 10)}`,
      )
    }
    console.log('')

    await prisma.$disconnect()
  },
})

const del = defineCommand({
  meta: {
    name: 'delete',
    description: 'Delete a user',
  },
  args: {
    email: {
      type: 'string',
      description: 'User email',
    },
    id: {
      type: 'string',
      description: 'User ID',
    },
    force: {
      type: 'boolean',
      description: 'Force delete (required for ADMIN users)',
      default: false,
    },
  },
  async run({ args }) {
    const { email, id, force } = args

    if (!email && !id) {
      log.error('Either --email or --id is required')
      process.exit(1)
    }

    const where = email ? { email: email.toLowerCase() } : { id: Number.parseInt(id!) }
    const user = await prisma.user.findUnique({ where })

    if (!user) {
      log.error('User not found')
      process.exit(1)
    }

    if (user.role === 'ADMIN' && !force) {
      log.warn('This user is an ADMIN. Use --force to confirm deletion.')
      process.exit(1)
    }

    await prisma.user.delete({ where: { id: user.id } })
    log.success(`User ${user.email} deleted successfully`)

    await prisma.$disconnect()
  },
})

const update = defineCommand({
  meta: {
    name: 'update',
    description: 'Update a user',
  },
  args: {
    email: {
      type: 'string',
      description: 'User email to update',
    },
    id: {
      type: 'string',
      description: 'User ID to update',
    },
    role: {
      type: 'string',
      description: 'New role: ADMIN, EDITOR, or VIEWER',
    },
    active: {
      type: 'boolean',
      description: 'Set active status',
    },
    firstName: {
      type: 'string',
      description: 'New first name',
    },
    lastName: {
      type: 'string',
      description: 'New last name',
    },
  },
  async run({ args }) {
    const { email, id, role, active, firstName, lastName } = args

    if (!email && !id) {
      log.error('Either --email or --id is required')
      process.exit(1)
    }

    const where = email ? { email: email.toLowerCase() } : { id: Number.parseInt(id!) }
    const user = await prisma.user.findUnique({ where })

    if (!user) {
      log.error('User not found')
      process.exit(1)
    }

    const data: Record<string, unknown> = {}

    if (role)
      data.role = parseRole(role)
    if (active !== undefined)
      data.isActive = active
    if (firstName !== undefined)
      data.firstName = firstName || null
    if (lastName !== undefined)
      data.lastName = lastName || null

    if (Object.keys(data).length === 0) {
      log.warn('No changes specified')
      process.exit(1)
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
    })

    log.success(`User ${updated.email} updated successfully`)
    console.log(`\n  ${c.gray}Role:${c.reset}      ${updated.role}`)
    console.log(`  ${c.gray}Active:${c.reset}    ${updated.isActive ? 'Yes' : 'No'}`)
    if (updated.firstName || updated.lastName) {
      console.log(`  ${c.gray}Name:${c.reset}      ${[updated.firstName, updated.lastName].filter(Boolean).join(' ')}`)
    }

    await prisma.$disconnect()
  },
})

const resetPassword = defineCommand({
  meta: {
    name: 'reset-password',
    description: 'Reset user password',
  },
  args: {
    email: {
      type: 'string',
      description: 'User email',
    },
    id: {
      type: 'string',
      description: 'User ID',
    },
    password: {
      type: 'string',
      description: 'New password',
      required: true,
    },
  },
  async run({ args }) {
    const { email, id, password } = args

    if (!email && !id) {
      log.error('Either --email or --id is required')
      process.exit(1)
    }

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) {
      log.error(passwordCheck.message!)
      process.exit(1)
    }

    const where = email ? { email: email.toLowerCase() } : { id: Number.parseInt(id!) }
    const user = await prisma.user.findUnique({ where })

    if (!user) {
      log.error('User not found')
      process.exit(1)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(password) },
    })

    // Revoke all refresh tokens for security
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    log.success(`Password reset successfully for ${user.email}`)
    log.info('All existing sessions have been invalidated')

    await prisma.$disconnect()
  },
})

const seed = defineCommand({
  meta: {
    name: 'seed',
    description: 'Create test users (admin, editor, viewer)',
  },
  async run() {
    log.info('Seeding test users...\n')

    const testUsers = [
      { email: 'admin@test.com', password: 'Admin123!', role: Role.ADMIN, firstName: 'Admin', lastName: 'User' },
      { email: 'editor@test.com', password: 'Editor123!', role: Role.EDITOR, firstName: 'Editor', lastName: 'User' },
      { email: 'viewer@test.com', password: 'Viewer123!', role: Role.VIEWER, firstName: 'Viewer', lastName: 'User' },
    ]

    for (const userData of testUsers) {
      const existing = await prisma.user.findUnique({ where: { email: userData.email } })

      if (existing) {
        log.warn(`User ${userData.email} already exists, skipping...`)
        continue
      }

      await prisma.user.create({
        data: {
          email: userData.email,
          password: await hashPassword(userData.password),
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isActive: true,
        },
      })

      log.success(`Created ${userData.role.toLowerCase()}: ${userData.email} (password: ${userData.password})`)
    }

    console.log('')
    log.success('Seeding complete!')

    await prisma.$disconnect()
  },
})

// Main command
const main = defineCommand({
  meta: {
    name: 'user',
    version: '1.0.0',
    description: 'User management CLI for Landing Page Editor',
  },
  subCommands: {
    create,
    list,
    'delete': del,
    update,
    'reset-password': resetPassword,
    seed,
  },
})

runMain(main)
