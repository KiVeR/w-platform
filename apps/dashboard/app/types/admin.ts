export interface Router {
  id: number
  name: string
  external_id: string
  num_stop: number | null
  created_at: string | null
  updated_at: string | null
}

export interface RouterForm {
  name: string
  external_id: string
  num_stop: number | null
}

export interface VariableField {
  id: number
  name: string
  is_used: boolean
  is_global: boolean
  created_at: string | null
  updated_at: string | null
}

export type VariableFieldForm = Pick<VariableField, 'name' | 'is_used' | 'is_global'>

export type VariableSchemaDataSet = Record<string, unknown>

export interface VariableSchema {
  id: number
  uuid: string
  partner_id: number | null
  name: string
  global_data: VariableSchemaDataSet | null
  recipient_preview_data: VariableSchemaDataSet | null
  fields: VariableField[]
  created_at: string | null
  updated_at: string | null
  partner?: {
    id: number
    name: string
  } | null
}

export interface VariableSchemaForm {
  partner_id: number | null
  name: string
  global_data: VariableSchemaDataSet | null
  recipient_preview_data: VariableSchemaDataSet | null
  fields: VariableFieldForm[]
}

export function createEmptyVariableSchemaForm(partnerId: number | null = null): VariableSchemaForm {
  return {
    partner_id: partnerId,
    name: '',
    global_data: null,
    recipient_preview_data: null,
    fields: [],
  }
}
