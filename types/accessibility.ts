/**
 * Accessibility types for enhanced type safety and WCAG compliance
 */

// ARIA attributes with strict typing
export interface AriaAttributes {
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-hidden'?: boolean
  'aria-live'?: 'off' | 'polite' | 'assertive'
  'aria-atomic'?: boolean
  'aria-busy'?: boolean
  'aria-controls'?: string
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
  'aria-disabled'?: boolean
  'aria-invalid'?: boolean | 'grammar' | 'spelling'
  'aria-pressed'?: boolean | 'mixed'
  'aria-selected'?: boolean
  'aria-checked'?: boolean | 'mixed'
  'aria-required'?: boolean
  'aria-readonly'?: boolean
  'aria-multiline'?: boolean
  'aria-multiselectable'?: boolean
  'aria-orientation'?: 'horizontal' | 'vertical'
  'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other'
  'aria-valuemin'?: number
  'aria-valuemax'?: number
  'aria-valuenow'?: number
  'aria-valuetext'?: string
  'aria-level'?: number
  'aria-posinset'?: number
  'aria-setsize'?: number
  'aria-rowcount'?: number
  'aria-rowindex'?: number
  'aria-colcount'?: number
  'aria-colindex'?: number
  'aria-colspan'?: number
  'aria-rowspan'?: number
}

// Semantic HTML roles with strict typing
export type AriaRole = 
  | 'alert'
  | 'alertdialog'
  | 'application'
  | 'article'
  | 'banner'
  | 'button'
  | 'cell'
  | 'checkbox'
  | 'columnheader'
  | 'combobox'
  | 'complementary'
  | 'contentinfo'
  | 'dialog'
  | 'document'
  | 'feed'
  | 'figure'
  | 'form'
  | 'grid'
  | 'gridcell'
  | 'group'
  | 'heading'
  | 'img'
  | 'link'
  | 'list'
  | 'listbox'
  | 'listitem'
  | 'log'
  | 'main'
  | 'marquee'
  | 'math'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'navigation'
  | 'none'
  | 'note'
  | 'option'
  | 'presentation'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'region'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'scrollbar'
  | 'search'
  | 'searchbox'
  | 'separator'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'switch'
  | 'tab'
  | 'table'
  | 'tablist'
  | 'tabpanel'
  | 'term'
  | 'textbox'
  | 'timer'
  | 'toolbar'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem'

// Enhanced component props with accessibility requirements
export interface AccessibleComponentProps extends AriaAttributes {
  role?: AriaRole
  tabIndex?: number
  id?: string
  className?: string
  'data-testid'?: string
}

// Focus management types
export interface FocusableElement {
  focus(): void
  blur(): void
  tabIndex: number
}

export interface FocusManager {
  trapFocus(container: HTMLElement): () => void
  restoreFocus(element?: HTMLElement): void
  getFirstFocusableElement(container: HTMLElement): HTMLElement | null
  getLastFocusableElement(container: HTMLElement): HTMLElement | null
}

// Screen reader announcement types
export interface ScreenReaderAnnouncement {
  message: string
  priority: 'polite' | 'assertive'
  delay?: number
}

// Keyboard navigation types
export interface KeyboardHandler {
  key: string
  handler: (event: KeyboardEvent) => void
  preventDefault?: boolean
  stopPropagation?: boolean
}

export interface KeyboardNavigation {
  handlers: KeyboardHandler[]
  trapFocus?: boolean
  autoFocus?: boolean
}

// Color contrast and theme types
export interface ColorContrastRatio {
  normal: number // Minimum 4.5:1 for WCAG AA
  large: number  // Minimum 3:1 for WCAG AA large text
}

export interface AccessibilityTheme {
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    error: string
    warning: string
    success: string
    info: string
  }
  contrast: {
    normal: ColorContrastRatio
    enhanced: ColorContrastRatio // WCAG AAA standards
  }
  focusRing: {
    color: string
    width: string
    style: 'solid' | 'dashed' | 'dotted'
  }
}

// Form accessibility types
export interface AccessibleFormField {
  id: string
  label: string
  required?: boolean
  error?: string
  description?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

// Loading and status types for screen readers
export interface LoadingState {
  isLoading: boolean
  loadingText?: string
  completedText?: string
  errorText?: string
}

export interface StatusAnnouncement {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
  dismissible?: boolean
}