import {
  MousePointer2,
  Type,
  Pencil,
  ImagePlus,
  Highlighter,
  BookmarkPlus,
  FilePlus,
  Save,
  Undo2,
  Redo2,
  Loader2,
} from 'lucide-react'

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'draw', icon: Pencil, label: 'Draw' },
  { id: 'image', icon: ImagePlus, label: 'Add image' },
  { id: 'highlight', icon: Highlighter, label: 'Highlight' },
]

export default function EditingToolbar({
  activeTool,
  onToolChange,
  onBookmark,
  onAddPage,
  onSave,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  saving = false,
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap p-2 border-b border-border bg-card">
      {tools.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onToolChange(id)}
          className={`p-2 rounded-lg transition-colors ${
            activeTool === id
              ? 'bg-primary text-white'
              : 'text-body hover:bg-border'
          }`}
          title={label}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
      <div className="w-px h-6 bg-border mx-1" />
      <button
        type="button"
        onClick={onBookmark}
        className="p-2 rounded-lg text-body hover:bg-border transition-colors"
        title="Bookmark current page"
      >
        <BookmarkPlus className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={onAddPage}
        className="p-2 rounded-lg text-body hover:bg-border transition-colors"
        title="Add page"
      >
        <FilePlus className="w-5 h-5" />
      </button>
      <div className="w-px h-6 bg-border mx-1" />
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="p-2 rounded-lg text-body hover:bg-border transition-colors disabled:opacity-40"
        title="Undo"
      >
        <Undo2 className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className="p-2 rounded-lg text-body hover:bg-border transition-colors disabled:opacity-40"
        title="Redo"
      >
        <Redo2 className="w-5 h-5" />
      </button>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-70"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save PDF
          </>
        )}
      </button>
    </div>
  )
}