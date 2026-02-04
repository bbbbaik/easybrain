import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Heading1, Heading2, Heading3, List, CheckSquare, Quote, Code } from 'lucide-react'

// 메뉴 아이템 정의
export const items = [
  {
    title: '제목 1',
    description: '가장 큰 제목',
    icon: <Heading1 size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
    },
  },
  {
    title: '제목 2',
    description: '중간 크기 제목',
    icon: <Heading2 size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
    },
  },
  {
    title: '제목 3',
    description: '작은 제목',
    icon: <Heading3 size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
    },
  },
  {
    title: '할 일 목록',
    description: '체크박스 리스트',
    icon: <CheckSquare size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: '불렛 목록',
    description: '점(Bullet) 리스트',
    icon: <List size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: '인용구',
    description: '강조하고 싶은 문구',
    icon: <Quote size={18} />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
]

const CommandList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command(item)
    }
  }

  // 키보드 조작 핸들링 (부모에서 호출)
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  useEffect(() => {
    setSelectedIndex(0)
  }, [props.items])

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden min-w-[300px] p-1 animate-in fade-in zoom-in-95 duration-100">
      {props.items.length ? (
        props.items.map((item: any, index: number) => (
          <button
            className={`flex items-center gap-3 w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
              index === selectedIndex ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded border ${index === selectedIndex ? 'bg-white border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
              {item.icon}
            </div>
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-gray-400">{item.description}</p>
            </div>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-gray-400">결과 없음</div>
      )}
    </div>
  )
})

CommandList.displayName = 'CommandList'

export default CommandList
