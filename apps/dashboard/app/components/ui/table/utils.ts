import type { Ref } from "vue"

type Updater<T> = T | ((value: T) => T)

function isUpdaterFunction<T>(value: Updater<T>): value is (value: T) => T {
  return typeof value === "function"
}

export function valueUpdater<T>(updaterOrValue: Updater<T>, ref: Ref<T>) {
  ref.value = isUpdaterFunction(updaterOrValue)
    ? updaterOrValue(ref.value)
    : updaterOrValue
}
