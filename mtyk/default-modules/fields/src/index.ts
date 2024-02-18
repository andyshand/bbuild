export type Field = {
  type: string
  name: string
}

export type TextInputField = Field & {
  type: "text" | "url" | "email" | "tel" | "password" | "search";
  value: string;
}
export type PasswordField = Field & {
  type: "password"
  value: string
}

export type EmailField = Field & {
  type: "email"
  value: string
}

export type NumberField = Field & {
  type: "number"
  value: number
}

export type RangeField = Field & {
  type: "range"
  value: number
  min: number
  max: number
}

export type DateField = Field & {
  type: "date"
  value: string
}

export type CheckboxField = Field & {
  type: "checkbox"
  checked: boolean
}

export type RadioField = Field & {
  type: "radio"
  name: string
  value: string
  checked: boolean
}

export type SelectField = Field & {
  type: "select"
  options: Array<{ value: string, label: string, selected?: boolean }>
}

export type TextAreaField = Field & {
  type: "textarea"
  value: string
}

export type AllFields = TextInputField | PasswordField | EmailField | NumberField | RangeField | DateField | CheckboxField | RadioField | SelectField | TextAreaField
export type FieldSpec = Omit<AllFields, 'value'>
