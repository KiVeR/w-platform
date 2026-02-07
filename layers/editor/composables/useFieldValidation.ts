import type { Ref } from 'vue'
import type { WidgetType } from '@/types/widget'
import { computed, ref, watch } from 'vue'
import {
  getContentSchemaForWidget,
  getContentValidationErrors,
} from '~~/shared/schemas/widgets'

export interface FieldValidationOptions {
  /** Validate on blur instead of on change */
  validateOnBlur?: boolean
  /** Debounce time in ms for validation */
  debounceMs?: number
}

export interface FieldValidation {
  /** Current error message for this field, or null if valid */
  error: Ref<string | null>
  /** Whether the field has been touched (blurred) */
  touched: Ref<boolean>
  /** Validate the current value and return true if valid */
  validate: (value: unknown) => boolean
  /** Mark the field as touched */
  touch: () => void
  /** Reset the field state */
  reset: () => void
}

/**
 * Composable for validating a single field against widget content schema
 */
export function useFieldValidation(
  widgetType: Ref<WidgetType> | WidgetType,
  fieldName: string,
  _options: FieldValidationOptions = {},
): FieldValidation {
  const error = ref<string | null>(null)
  const touched = ref(false)

  const resolvedWidgetType = computed(() =>
    typeof widgetType === 'string' ? widgetType : widgetType.value,
  )

  function validate(value: unknown): boolean {
    const schema = getContentSchemaForWidget(resolvedWidgetType.value)

    if (!schema) {
      // No schema for this widget type, consider it valid
      error.value = null
      return true
    }

    // Create a partial object with just this field to validate
    const partialContent = { [fieldName]: value }
    const result = schema.safeParse(partialContent)

    if (result.success) {
      error.value = null
      return true
    }

    // Find error for this specific field
    const fieldError = result.error.issues.find(
      issue => issue.path.includes(fieldName),
    )

    error.value = fieldError?.message ?? null
    return !fieldError
  }

  function touch() {
    touched.value = true
  }

  function reset() {
    error.value = null
    touched.value = false
  }

  return {
    error,
    touched,
    validate,
    touch,
    reset,
  }
}

/**
 * Composable for validating all content fields of a widget
 */
export function useWidgetValidation(
  widgetType: Ref<WidgetType> | WidgetType,
  content: Ref<Record<string, unknown>>,
) {
  const errors = ref<Record<string, string>>({})
  const isValid = ref(true)

  const resolvedWidgetType = computed(() =>
    typeof widgetType === 'string' ? widgetType : widgetType.value,
  )

  function validate(): boolean {
    const validationErrors = getContentValidationErrors(
      resolvedWidgetType.value,
      content.value,
    )

    errors.value = validationErrors
    isValid.value = Object.keys(validationErrors).length === 0

    return isValid.value
  }

  function getFieldError(fieldName: string): string | undefined {
    return errors.value[fieldName]
  }

  function clearErrors() {
    errors.value = {}
    isValid.value = true
  }

  // Auto-validate when content changes
  watch(
    content,
    () => {
      validate()
    },
    { deep: true },
  )

  // Initial validation
  validate()

  return {
    errors,
    isValid,
    validate,
    getFieldError,
    clearErrors,
  }
}
