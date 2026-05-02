/** Minimal type stubs – no React dependency */
export type TranslationKey = string
export type Translation = Record<string, string>

export type EditorComponentData = {
  _id: string
  _name: string
  [key: string]: any
}

export type Device = {
  name: string
  width: number | '100%'
  height: number | '100%'
  icon: 'tablet' | 'mobile' | 'desktop'
}

export type Action = {
  position: 'header' | 'footer'
  icon: string
  action: (e: Event) => void
  title: string
}

export type EditorComponentTemplate = {
  name: string
  description: string
  image: string
  data: Omit<EditorComponentData, '_id'>[] | (() => Promise<Omit<EditorComponentData, '_id'>[]>)
}

export type FieldDefinition<O = any, V = any> = {
  name: string
  options: O
  group?: boolean
  fields?: FieldDefinition[]
  shouldRender: (data: Record<string, any>) => boolean
  [key: string]: any
}

export type EditorComponentDefinition = {
  title: string
  label?: string
  fields: FieldDefinition[]
  category?: string
}

export type EditorComponentDefinitions = Record<string, EditorComponentDefinition>

export type FieldCondition = (data: Record<string, any>) => boolean

export interface IndexableObject {
  _id: string
}
