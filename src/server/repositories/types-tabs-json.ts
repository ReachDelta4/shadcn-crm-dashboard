export type TabsJsonV1Meta = {
  one_line_summary: string
  stage: string
  sentiment?: string
  deal_score?: number
  chance_of_sale?: number
  confidence: 'low' | 'medium' | 'high'
  key_terms?: string[]
  participants?: string[]
}

export type TabsJsonV1Section = {
  id: string
  slug_path: string
  kind: 'executive_summary' | 'chance_of_sale' | 'sub_section'
  title: string
  level: number
  markdown: string
  metrics?: Record<string, any>
  citations?: Array<Record<string, any>>
}

export type TabsJsonV1 = {
  schema_version: 'tabs_json_v1'
  session_id: string
  generated_at: string
  meta: TabsJsonV1Meta
  sections: TabsJsonV1Section[]
  raw_markdown?: string
}

