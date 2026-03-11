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
}

export type VariableFieldForm = Pick<VariableField, 'name' | 'is_used' | 'is_global'>

export interface VariableSchema {
  id: number
  uuid: string
  partner_id: number | null
  name: string
  global_data: Record<string, unknown> | null
  recipient_preview_data: Array<Record<string, unknown>> | null
  fields: VariableField[]
  created_at: string | null
  updated_at: string | null
}

export interface VariableSchemaForm {
  name: string
  global_data: Record<string, unknown> | null
  recipient_preview_data: Array<Record<string, unknown>> | null
  fields: VariableFieldForm[]
}
