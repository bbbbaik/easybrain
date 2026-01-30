'use client'

import React, { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Layers } from 'lucide-react'
import { FolderTree } from './FolderTree'
import { createClient } from '@/lib/supabase/client'

interface CategoryTreeProps {
  category: any
  selectedTaskId?: string | null
  onSelectTask?: (taskId: string) => void
}

export default function CategoryTree({
  category,
  selectedTaskId = null,
  onSelectTask = () => {},
}: CategoryTreeProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [folders, setFolders] = useState<any[]>([])
  const supabase = createClient()

  const toggleOpen = () => setIsOpen(!isOpen)

  useEffect(() => {
    async function fetchFolders() {
      if (!isOpen) return

      console.log('Fetching folders for:', category.name)

      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('category_id', category.id)
        .order('position', { ascending: true })

      if (error) {
        console.error('Error fetching folders:', error)
      } else {
        console.log('Folders found:', data)
        if (data) setFolders(data)
      }
    }
    fetchFolders()
  }, [category.id, isOpen])

  return (
    <div className="mb-4">
      <div
        className="flex items-center px-2 py-2 mb-1 text-xs font-bold text-gray-500 cursor-pointer hover:bg-slate-50 rounded-md"
        onClick={toggleOpen}
      >
        <span className="mr-1">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <Layers size={14} className="mr-2" />
        {category.name}
      </div>

      {isOpen && (
        <div className="flex flex-col gap-1">
          {folders.length > 0 ? (
            folders.map((folder) => (
              <FolderTree
                key={folder.id}
                folder={folder}
                level={1}
                selectedTaskId={selectedTaskId}
                onSelectTask={onSelectTask}
              />
            ))
          ) : (
            <div className="pl-8 text-xs text-gray-400 py-1">빈 카테고리 (폴더 없음)</div>
          )}
        </div>
      )}
    </div>
  )
}
