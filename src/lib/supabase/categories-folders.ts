import { createClient } from '@/lib/supabase/client'
import type { Category, Folder } from '@/types/category-folder.types'

export async function getCategories() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return (data || []) as Category[]
}

export async function getFolders(categoryId?: string | null, parentId?: string | null) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  let query = supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)

  if (categoryId) {
    query = query.eq('category_id', categoryId).is('parent_id', null)
  } else if (parentId) {
    query = query.eq('parent_id', parentId)
  } else {
    // 모든 폴더 가져오기
    query = query.order('position', { ascending: true })
  }

  const { data, error } = await query.order('position', { ascending: true })

  if (error) {
    console.error('Error fetching folders:', error)
    return []
  }

  return (data || []) as Folder[]
}

export async function createCategory(name: string, color?: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name,
      color: color || null,
      position: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function createFolder(
  name: string,
  categoryId?: string | null,
  parentId?: string | null
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('folders')
    .insert({
      user_id: user.id,
      name,
      category_id: categoryId || null,
      parent_id: parentId || null,
      position: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as Folder
}

export async function deleteCategory(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function deleteFolder(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('folders').delete().eq('id', id)
  if (error) throw error
}
