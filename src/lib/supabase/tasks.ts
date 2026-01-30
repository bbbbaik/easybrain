import { createClient } from '@/lib/supabase/client'

export interface Task {
  id: string
  user_id: string
  folder_id: string | null
  category_id: string | null
  title: string
  content: string | null
  status: 'todo' | 'in_progress' | 'done' | 'archived'
  is_completed: boolean
  is_important: boolean
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
  completed_at: string | null
}

export async function createTask(
  title: string,
  content: string | null = null,
  folderId: string | null = null
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title,
      content,
      folder_id: folderId,
      status: 'todo',
      is_completed: false,
      is_important: false,
    })
    .select()
    .single()

  if (error) throw error
  return data as Task
}

export async function updateTask(
  taskId: string,
  updates: {
    title?: string
    content?: string | null
    folder_id?: string | null
    position?: number
  }
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data as Task
}

/** Same-folder reorder: update position for each task in order (Optimistic UI 후 호출) */
export async function updateTaskPositions(
  folderId: string | null,
  orderedTaskIds: string[]
): Promise<void> {
  const supabase = createClient()
  for (let i = 0; i < orderedTaskIds.length; i++) {
    const { error } = await supabase
      .from('tasks')
      .update({ position: i })
      .eq('id', orderedTaskIds[i])
    if (error) throw error
  }
}

export async function getTasks(folderId?: string | null) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  let query = supabase.from('tasks').select('*').eq('user_id', user.id)

  if (folderId !== undefined && folderId !== null) {
    query = query.eq('folder_id', folderId)
  } else {
    query = query.is('folder_id', null)
  }

  const { data, error } = await query.order('position', { ascending: true }).order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }

  return (data || []) as Task[]
}

export async function getTask(taskId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data as Task
}
