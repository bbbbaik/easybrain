'use client'

import { useState } from 'react'
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface IconPickerProps {
  value?: string | null
  onChange: (emoji: string | null) => void
  defaultIcon?: string
}

export function IconPicker({ value, onChange, defaultIcon = '📄' }: IconPickerProps) {
  const [open, setOpen] = useState(false)

  // 현재 테마 감지 (다크 모드 지원)
  const getTheme = (): Theme => {
    if (typeof window === 'undefined') return Theme.LIGHT
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji)
    setOpen(false)
  }

  const handleRemove = () => {
    onChange(null)
    setOpen(false)
  }

  const displayIcon = value || defaultIcon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-2xl hover:bg-slate-100 rounded"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          {displayIcon}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="relative">
          {/* 이모지 제거 버튼 */}
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 z-10 p-1 rounded hover:bg-slate-100 text-xs text-gray-500 hover:text-gray-700"
              title="아이콘 제거"
            >
              <X size={14} />
            </button>
          )}
          <EmojiPicker
            theme={getTheme()}
            onEmojiClick={handleEmojiClick}
            width={350}
            height={400}
            searchDisabled={false}
            skinTonesDisabled={true}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
