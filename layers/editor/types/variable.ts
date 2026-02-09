export interface VariableField {
  name: string
  type: 'global' | 'recipient'
  description?: string
  example?: string
}

export interface DataSet {
  key: string
  merged_preview_data: Record<string, string>
}

export interface VariableSchema {
  uuid?: string
  globalVariables: VariableField[]
  recipientVariables: VariableField[]
  dataSets: DataSet[]
}

export interface VariableSchemaListItem {
  id: string
  name: string
  global_variables: VariableField[]
  recipient_variables: VariableField[]
  campaigns_count?: number
  created_at: string
}

export interface VariableSchemaListResponse {
  data: VariableSchemaListItem[]
  meta: {
    current_page: number
    last_page: number
    total: number
    per_page: number
  }
}
