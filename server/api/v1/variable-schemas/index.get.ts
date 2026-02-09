export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)

  // Build query string for trigger-api, forwarding pagination and filter params
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null)
      params.set(key, String(value))
  }

  const qs = params.toString()
  const path = `/api/variable-schemas${qs ? `?${qs}` : ''}`

  return triggerApiFetch(event, path)
})
