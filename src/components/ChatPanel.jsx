import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, Lightbulb } from 'lucide-react'
import { useChatStore } from '../store/useChatStore'
import { sendChatMessage } from '../utils/geminiApi'

export default function ChatPanel() {
  const { mode, setMode, messages, addMessage, clearMessages } = useChatStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    addMessage({ role: 'user', text })
    setInput('')
    setLoading(true)
    try {
      const reply = await sendChatMessage(
        [...messages, { role: 'user', text }],
        mode
      )
      addMessage({ role: reply.role, text: reply.text })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="p-3 border-b border-border bg-card flex gap-2">
        <button
          type="button"
          onClick={() => setMode('discuss')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'discuss'
              ? 'bg-primary text-white'
              : 'text-muted hover:bg-border'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Discuss
        </button>
        <button
          type="button"
          onClick={() => setMode('explain')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'explain'
              ? 'bg-primary text-white'
              : 'text-muted hover:bg-border'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          Explain
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-muted text-sm text-center py-8">
            {mode === 'discuss'
              ? 'Paste a paragraph and start a conversation.'
              : 'Paste a word or sentence for an instant explanation.'}
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-body'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-xl px-4 py-2.5">
              <span className="text-muted text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t border-border bg-card">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={
              mode === 'discuss'
                ? 'Paste text or type your question...'
                : 'Paste a word or sentence to explain...'
            }
            rows={2}
            className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="self-end p-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            title="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-muted mt-1.5">Mode: {mode === 'discuss' ? 'Discuss' : 'Explain'}</p>
      </div>
    </div>
  )
}
