export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, statusMessage: 'Missing UUID' })
  }

  const body = await readBody(event)

  return triggerApiFetch(event, `/api/variable-schemas/${uuid}/mark-unused`, {
    method: 'POST',
    body,
  })
})
