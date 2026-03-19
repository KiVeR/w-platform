export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, statusMessage: 'Missing UUID' })
  }

  return platformApiFetch(event, `/api/internal/variable-schemas/${uuid}`)
})
