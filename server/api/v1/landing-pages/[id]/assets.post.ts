import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { createAuditLog } from '../../../../utils/audit'
import { requireAuth, requireLandingPage, requirePermission } from '../../../../utils/permissions'
import prisma from '../../../../utils/prisma'

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

export default defineEventHandler(async (event) => {
  // Require authentication
  const user = await requireAuth(event)

  // Get landing page ID from route params
  const id = Number(getRouterParam(event, 'id'))

  if (Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: 'ID invalide',
    })
  }

  // Verify landing page exists
  await requireLandingPage(id)

  // Check permission (EDIT or higher)
  await requirePermission(user.id, id, 'EDIT')

  // Parse multipart form data
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Aucun fichier fourni',
    })
  }

  const uploadedAssets = []

  for (const file of formData) {
    if (!file.data || !file.type || !file.filename) {
      continue
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw createError({
        statusCode: 400,
        message: `Type de fichier non autorisé: ${file.type}`,
      })
    }

    // Validate file size
    if (file.data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        message: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
      })
    }

    // Generate unique filename
    const ext = file.filename.split('.').pop() || 'bin'
    const uniqueFilename = `${randomUUID()}.${ext}`
    const storageKey = `landing-pages/${id}/${uniqueFilename}`

    // In development: store locally
    // In production: would use Azure Blob Storage
    const config = useRuntimeConfig()
    const isDev = config.public.nodeEnv === 'development' || !config.azureBlobConnectionString

    let url: string

    if (isDev) {
      // Local storage
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'landing-pages', String(id))
      await mkdir(uploadDir, { recursive: true })

      const filePath = join(uploadDir, uniqueFilename)
      await writeFile(filePath, file.data)

      url = `/uploads/landing-pages/${id}/${uniqueFilename}`
    }
    else {
      // Azure Blob Storage - placeholder for production
      // TODO: Implement Azure Blob upload
      // const blobClient = containerClient.getBlockBlobClient(storageKey)
      // await blobClient.uploadData(file.data, { blobHTTPHeaders: { blobContentType: file.type } })
      // url = blobClient.url

      // For now, fall back to local storage
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'landing-pages', String(id))
      await mkdir(uploadDir, { recursive: true })

      const filePath = join(uploadDir, uniqueFilename)
      await writeFile(filePath, file.data)

      url = `/uploads/landing-pages/${id}/${uniqueFilename}`
    }

    // Create asset record
    const asset = await prisma.asset.create({
      data: {
        landingPageId: id,
        filename: file.filename,
        mimeType: file.type,
        size: file.data.length,
        url,
        storageKey,
      },
    })

    uploadedAssets.push(asset)

    // Audit log
    await createAuditLog(event, {
      userId: user.id,
      action: 'ASSET_UPLOADED',
      entityType: 'ASSET',
      entityId: asset.id,
      details: {
        landingPageId: id,
        filename: file.filename,
        mimeType: file.type,
        size: file.data.length,
      },
    })
  }

  return {
    success: true,
    assets: uploadedAssets,
  }
})
