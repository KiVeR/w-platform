export const InputStub = {
  template: '<input :value="modelValue" v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  inheritAttrs: true,
}

export const SlotStub = { template: '<div><slot /></div>' }

export const CheckboxStub = {
  template: '<input type="checkbox" :checked="checked" @change="$emit(\'update:checked\', !checked)" />',
  props: ['checked'],
  emits: ['update:checked'],
}
