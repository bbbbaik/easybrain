import React, { useState } from "react";
import { Droppable, DroppableProvided, DroppableStateSnapshot } from "@hello-pangea/dnd";
import { ChevronRight, ChevronDown, Folder } from "lucide-react";
import TaskList from "./TaskList";

interface FolderTreeProps {
  folder: any;
  level?: number;
  selectedTaskId?: string | null;
  onSelectTask?: (taskId: string) => void;
}

export function FolderTree({
  folder,
  level = 0,
  selectedTaskId = null,
  onSelectTask = () => {},
}: FolderTreeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => setIsOpen(!isOpen);
  const dropZoneId = `folder-${folder.id}`;

  return (
    <div className="mb-1">
      <Droppable droppableId={dropZoneId} type="TASK">
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            onClick={toggleOpen}
            className={`
              flex items-center px-2 py-1.5 rounded-md cursor-pointer text-sm select-none transition-colors
              ${snapshot.isDraggingOver ? "bg-blue-100 ring-2 ring-blue-300" : "hover:bg-slate-100"}
              border-2 border-red-500
            `}
            style={{ marginLeft: `${level * 12}px` }}
          >
            <span className="mr-1 text-slate-400">
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <Folder
              size={16}
              className={`mr-2 ${snapshot.isDraggingOver ? "text-blue-500" : "text-slate-500"}`}
            />
            <span className="font-medium text-slate-700">{folder.name}</span>
            <div className="w-0 h-0 overflow-hidden opacity-0">{provided.placeholder}</div>
          </div>
        )}
      </Droppable>

      {isOpen && (
        <div className="mt-1 pl-4">
          <TaskList
            folderId={folder.id}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
            indentClassName="ml-6"
          />
        </div>
      )}
    </div>
  );
}
