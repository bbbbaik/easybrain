export interface Category {
  id: string
  user_id: string
  name: string
  color: string | null
  icon: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  user_id: string
  category_id: string | null
  parent_id: string | null
  name: string
  position: number
  created_at: string
  updated_at: string
}

export interface CategoryWithFolders extends Category {
  folders: Folder[]
}
