export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived'
export type ReminderRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          icon: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string | null
          icon?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string | null
          icon?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          parent_id: string | null
          name: string
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          parent_id?: string | null
          name: string
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          parent_id?: string | null
          name?: string
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          folder_id: string | null
          category_id: string | null
          title: string
          content: string | null
          status: TaskStatus
          is_completed: boolean
          is_important: boolean
          due_date: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          folder_id?: string | null
          category_id?: string | null
          title: string
          content?: string | null
          status?: TaskStatus
          is_completed?: boolean
          is_important?: boolean
          due_date?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          folder_id?: string | null
          category_id?: string | null
          title?: string
          content?: string | null
          status?: TaskStatus
          is_completed?: boolean
          is_important?: boolean
          due_date?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string | null
          created_at?: string
        }
      }
      task_tags: {
        Row: {
          task_id: string
          tag_id: string
        }
        Insert: {
          task_id: string
          tag_id: string
        }
        Update: {
          task_id?: string
          tag_id?: string
        }
      }
      task_attachments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          file_name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          created_at?: string
        }
      }
      task_reminders: {
        Row: {
          id: string
          task_id: string
          user_id: string
          reminder_date: string
          recurrence: ReminderRecurrence
          recurrence_rule: string | null
          timezone: string
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          reminder_date: string
          recurrence?: ReminderRecurrence
          recurrence_rule?: string | null
          timezone?: string
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          reminder_date?: string
          recurrence?: ReminderRecurrence
          recurrence_rule?: string | null
          timezone?: string
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      task_links: {
        Row: {
          id: string
          from_task_id: string
          to_task_id: string
          user_id: string
          link_type: string
          created_at: string
        }
        Insert: {
          id?: string
          from_task_id: string
          to_task_id: string
          user_id: string
          link_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          from_task_id?: string
          to_task_id?: string
          user_id?: string
          link_type?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      task_status: TaskStatus
      reminder_recurrence: ReminderRecurrence
    }
  }
}
