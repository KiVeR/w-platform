export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)

  // Forward pagination and filters to the platform internal compat endpoint.
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null)
      params.set(key, String(value))
  }

  const qs = params.toString()
  const path = `/api/internal/variable-schemas${qs ? `?${qs}` : ''}`

  return platformApiFetch(event, path)
})
