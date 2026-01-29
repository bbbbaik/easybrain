// Markdown Import/Export utilities
// This will be used for importing/exporting tasks in Markdown format

export interface MarkdownTask {
  title: string
  content: string
  tags: string[]
  status: 'todo' | 'in_progress' | 'done' | 'archived'
  is_important: boolean
  due_date?: string
  links?: string[] // Task IDs that this task links to
}

/**
 * Parse markdown content to extract task information
 * Format: 
 * # Task Title
 * 
 * Content here...
 * 
 * Tags: #tag1 #tag2
 * Status: done
 * Important: true
 * Due: 2024-01-01
 * Links: @task-id-1 @task-id-2
 */
export function parseMarkdownTask(markdown: string): MarkdownTask {
  const lines = markdown.split('\n')
  const task: Partial<MarkdownTask> = {
    title: '',
    content: '',
    tags: [],
    status: 'todo',
    is_important: false,
  }

  let inContent = false
  const contentLines: string[] = []

  for (const line of lines) {
    // Title
    if (line.startsWith('# ')) {
      task.title = line.substring(2).trim()
      continue
    }

    // Metadata
    if (line.startsWith('Tags:')) {
      const tagsMatch = line.match(/#(\w+)/g)
      task.tags = tagsMatch ? tagsMatch.map(t => t.substring(1)) : []
      continue
    }

    if (line.startsWith('Status:')) {
      const status = line.substring(7).trim() as MarkdownTask['status']
      if (['todo', 'in_progress', 'done', 'archived'].includes(status)) {
        task.status = status
      }
      continue
    }

    if (line.startsWith('Important:')) {
      task.is_important = line.substring(10).trim().toLowerCase() === 'true'
      continue
    }

    if (line.startsWith('Due:')) {
      task.due_date = line.substring(4).trim()
      continue
    }

    if (line.startsWith('Links:')) {
      const linksMatch = line.match(/@([a-f0-9-]+)/g)
      task.links = linksMatch ? linksMatch.map(l => l.substring(1)) : []
      continue
    }

    // Content
    if (inContent || line.trim()) {
      contentLines.push(line)
      inContent = true
    }
  }

  task.content = contentLines.join('\n').trim()

  return task as MarkdownTask
}

/**
 * Convert task to markdown format
 */
export function taskToMarkdown(task: MarkdownTask): string {
  const lines: string[] = []

  // Title
  lines.push(`# ${task.title}`)
  lines.push('')

  // Content
  if (task.content) {
    lines.push(task.content)
    lines.push('')
  }

  // Metadata
  if (task.tags.length > 0) {
    lines.push(`Tags: ${task.tags.map(t => `#${t}`).join(' ')}`)
  }

  lines.push(`Status: ${task.status}`)
  lines.push(`Important: ${task.is_important}`)

  if (task.due_date) {
    lines.push(`Due: ${task.due_date}`)
  }

  if (task.links && task.links.length > 0) {
    lines.push(`Links: ${task.links.map(l => `@${l}`).join(' ')}`)
  }

  return lines.join('\n')
}
