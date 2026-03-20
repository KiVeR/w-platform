export interface AsyncState<T, Args extends unknown[] = unknown[]> {
  /** The data returned by the async function */
  data: Ref<T | null>
  /** Whether the async operation is in progress */
  isLoading: Ref<boolean>
  /** Error message if the operation failed */
  error: Ref<string | null>
  /** Execute the async function */
  execute: (...args: Args) => Promise<T | null>
  /** Reset state to initial values */
  reset: () => void
}

export interface UseAsyncStateOptions<T> {
  /** Initial value for data */
  initialValue?: T | null
  /** Custom error message extractor */
  getErrorMessage?: (error: unknown) => string
  /** Callback on success */
  onSuccess?: (data: T) => void
  /** Callback on error */
  onError?: (error: unknown) => void
}

/**
 * Composable for managing async operations with loading and error states.
 *
 * @example
 * ```ts
 * const { data, isLoading, error, execute } = useAsyncState(
 *   async (id: string) => await fetchUser(id),
 *   { initialValue: null }
 * )
 *
 * // Execute the async function
 * await execute('user-123')
 *
 * // Use reactive state
 * if (isLoading.value) { ... }
 * if (error.value) { ... }
 * console.log(data.value)
 * ```
 */
export function useEditorAsyncState<T, Args extends unknown[] = unknown[]>(
  asyncFn: (...args: Args) => Promise<T>,
  options: UseAsyncStateOptions<T> = {},
): AsyncState<T, Args> {
  const {
    initialValue = null,
    getErrorMessage = defaultErrorMessage,
    onSuccess,
    onError,
  } = options

  const data = shallowRef<T | null>(initialValue)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function execute(...args: Args): Promise<T | null> {
    isLoading.value = true
    error.value = null

    try {
      const result = await asyncFn(...args)
      data.value = result
      onSuccess?.(result)
      return result
    }
    catch (err) {
      error.value = getErrorMessage(err)
      onError?.(err)
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  function reset() {
    data.value = initialValue
    isLoading.value = false
    error.value = null
  }

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
  }
}

/**
 * Default error message extractor for fetch errors.
 */
function defaultErrorMessage(err: unknown): string {
  // Handle Nuxt/ofetch errors
  if (typeof err === 'object' && err !== null) {
    const fetchError = err as { data?: { message?: string }, message?: string }
    if (fetchError.data?.message) {
      return fetchError.data.message
    }
    if (fetchError.message) {
      return fetchError.message
    }
  }

  // Handle standard Error
  if (err instanceof Error) {
    return err.message
  }

  return 'Une erreur est survenue'
}
