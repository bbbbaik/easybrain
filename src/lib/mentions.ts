// @mention parsing utilities for task linking

/**
 * Extract @mentions from markdown content
 * Format: @task-id or @[Task Title](task-id)
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@\[([^\]]+)\]\(([a-f0-9-]+)\)|@([a-f0-9-]+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    // Match @[Title](id) format
    if (match[2]) {
      mentions.push(match[2])
    }
    // Match @id format
    else if (match[3]) {
      mentions.push(match[3])
    }
  }

  return [...new Set(mentions)] // Remove duplicates
}

/**
 * Replace task IDs with @mention links in markdown
 */
export function createMentionLink(taskId: string, taskTitle: string): string {
  return `@[${taskTitle}](${taskId})`
}

/**
 * Parse markdown content and replace @task-id with proper mention links
 */
export function processMentions(content: string, taskMap: Map<string, string>): string {
  return content.replace(/@([a-f0-9-]+)/g, (match, taskId) => {
    const title = taskMap.get(taskId)
    if (title) {
      return `@[${title}](${taskId})`
    }
    return match
  })
}
