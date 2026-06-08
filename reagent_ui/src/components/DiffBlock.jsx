import { useMemo } from 'react'
import DiffMatchPatchLib from 'diff-match-patch'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

const DMP = typeof DiffMatchPatchLib === 'function'
  ? DiffMatchPatchLib
  : DiffMatchPatchLib.diff_match_patch

const EQUAL  =  0
const INSERT =  1
const DELETE = -1

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function computeDiff(original, updated) {
  const dmp  = new DMP()
  const diffs = dmp.diff_main(original, updated)
  dmp.diff_cleanupSemantic(diffs)
  return diffs
}

function buildMarked(diffs, side) {
  return diffs.map(([op, text]) => {
    if (op === EQUAL) return text
    if (side === 'original' && op === DELETE)
      return `<mark class="diff-del">${escHtml(text)}</mark>`
    if (side === 'replay' && op === INSERT)
      return `<mark class="diff-ins">${escHtml(text)}</mark>`
    return ''
  }).join('')
}

const MD_COMPONENTS = {
  table: props => (
    <div className="overflow-x-auto my-3">
      <table className="text-xs border-collapse w-full" {...props} />
    </div>
  ),
  th: props => (
    <th className="border border-gray-200 px-3 py-1.5 text-left font-semibold bg-gray-50 text-gray-700" {...props} />
  ),
  td: props => (
    <td className="border border-gray-200 px-3 py-1.5 text-gray-700 align-top" {...props} />
  ),
  h1: props => <h1 className="text-base font-bold text-gray-900 mt-4 mb-1" {...props} />,
  h2: props => <h2 className="text-sm font-bold text-gray-900 mt-4 mb-1" {...props} />,
  h3: props => <h3 className="text-sm font-semibold text-gray-800 mt-3 mb-1" {...props} />,
  p:  props => <p  className="text-xs text-gray-700 leading-relaxed mb-2" {...props} />,
  ul: props => <ul className="text-xs text-gray-700 list-disc list-inside mb-2 space-y-0.5" {...props} />,
  ol: props => <ol className="text-xs text-gray-700 list-decimal list-inside mb-2 space-y-0.5" {...props} />,
  li: props => <li className="leading-relaxed" {...props} />,
  code: ({ inline, ...props }) =>
    inline
      ? <code className="text-xs bg-gray-100 text-gray-800 px-1 py-0.5 rounded font-mono" {...props} />
      : <pre  className="text-xs bg-gray-900 text-gray-200 rounded-lg p-3 overflow-x-auto my-2 font-mono whitespace-pre-wrap" {...props} />,
  hr: () => <hr className="border-gray-200 my-3" />,
  strong: props => <strong className="font-semibold text-gray-900" {...props} />,
  blockquote: props => (
    <blockquote className="border-l-2 border-gray-300 pl-3 italic text-gray-500 my-2 text-xs" {...props} />
  ),
}

function Pane({ title, diffs, side }) {
  const marked = useMemo(() => buildMarked(diffs, side), [diffs, side])

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-medium">{title}</p>
      <div className="diff-pane text-xs leading-relaxed bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={MD_COMPONENTS}
        >
          {marked}
        </ReactMarkdown>
      </div>
    </div>
  )
}

export default function DiffBlock({ label, originalText, newText }) {
  const diffs = useMemo(
    () => computeDiff(originalText ?? '', newText ?? ''),
    [originalText, newText]
  )

  return (
    <div className="mb-6">
      {label && (
        <p className="text-xs font-medium text-gray-500 mb-3">{label}</p>
      )}
      <div className="flex gap-3">
        <Pane title="Original" diffs={diffs} side="original" />
        <Pane title="Replay"   diffs={diffs} side="replay"   />
      </div>
    </div>
  )
}
