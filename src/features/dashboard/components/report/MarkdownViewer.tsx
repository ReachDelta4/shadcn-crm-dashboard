'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import styles from './MarkdownViewer.module.css'

function isSafeHref(href?: string): boolean {
  if (!href || typeof href !== 'string') return false
  try {
    // Allow relative URLs
    if (href.startsWith('#') || href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) return true
    const u = new URL(href, 'http://local.test')
    const p = (u.protocol || '').toLowerCase()
    return p === 'http:' || p === 'https:' || p === 'mailto:' || p === 'tel:'
  } catch {
    return false
  }
}

interface MarkdownViewerProps {
	content: string
	className?: string
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
	if (!content) return null
	
	return (
		<div className={`${styles.reportFont} ${className || ''}`}>
			<ReactMarkdown 
				remarkPlugins={[remarkGfm, remarkBreaks as any]}
				components={{
            a: ({ href, children }) => {
              const safe = isSafeHref(href)
              if (!safe) {
                return <span className="text-muted-foreground cursor-not-allowed" aria-disabled>{children}</span>
              }
              // Always noopener/noreferrer to avoid tab-napping
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400 hover:opacity-90">
                  {children}
                </a>
              )
            },
					// Enhanced heading hierarchy like note-taking apps
					h1: ({ children }) => (
						<h1 className="text-6xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 mt-8 first:mt-0 border-b border-gray-200 dark:border-gray-800 pb-3">
							{children}
						</h1>
					),
					h2: ({ children }) => (
						<h2 className="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-5 mt-7 first:mt-0">
							{children}
						</h2>
					),
					h3: ({ children }) => (
						<h3 className="text-4xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-6 first:mt-0">
							{children}
						</h3>
					),
					h4: ({ children }) => (
						<h4 className="text-3xl font-semibold text-gray-700 dark:text-gray-200 mb-3 mt-5 first:mt-0">
							{children}
						</h4>
					),
					h5: ({ children }) => (
						<h5 className="text-2xl font-medium text-gray-700 dark:text-gray-200 mb-2 mt-4 first:mt-0">
							{children}
						</h5>
					),
					h6: ({ children }) => (
						<h6 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-2 mt-3 first:mt-0">
							{children}
						</h6>
					),
					// Enhanced lists with proper spacing and indentation
					ul: ({ children }) => (
						<ul className="list-disc list-outside space-y-1 mb-4 pl-6 text-gray-700 dark:text-gray-200">
							{children}
						</ul>
					),
					ol: ({ children }) => (
						<ol className="list-decimal list-outside space-y-1 mb-4 pl-6 text-gray-700 dark:text-gray-200">
							{children}
						</ol>
					),
					li: ({ children }) => (
						<li className="leading-relaxed">{children}</li>
					),
					// Enhanced paragraphs
					p: ({ children }) => (
						<p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-3">{children}</p>
					),
					// Enhanced blockquotes (with callout support like Obsidian)
					blockquote: ({ children }) => {
						const flatten = (node: any): string => {
							if (node == null) return ''
							if (typeof node === 'string') return node
							if (Array.isArray(node)) return node.map(flatten).join(' ')
							if (React.isValidElement(node)) return flatten((node as any).props?.children)
							return ''
						}
						const text = flatten(children)
						const match = text.match(/\[!([A-Z]+)\]/)
						const kind = (match?.[1] || '').toUpperCase()
						const base = 'border-l-4 pl-4 py-2 mb-4 rounded'
						const palette: Record<string,string> = {
							'NOTE': 'border-blue-500 bg-blue-50 dark:bg-blue-950/40',
							'TIP': 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
							'WARNING': 'border-amber-500 bg-amber-50 dark:bg-amber-950/40',
							'IMPORTANT': 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-950/40',
							'QUOTE': 'border-slate-500 bg-slate-50 dark:bg-slate-900/40',
						}
						const cls = match ? `${base} ${palette[kind] || palette['NOTE']}` : `${base} border-blue-500 bg-blue-50 dark:bg-blue-950/40 italic`
						return (
							<blockquote className={cls}>
								{children}
							</blockquote>
						)
					},
					// Enhanced code blocks
					code: ({ children, ...props }) => {
						const inline = (props as any)?.inline || false
						if (inline) {
							return (
								<code className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono">
									{children}
								</code>
							)
						}
						return (
							<code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm mb-4">
								{children}
							</code>
						)
					},
					// Enhanced tables
					table: ({ children }) => (
						<div className="overflow-x-auto mb-4">
							<table className="min-w-full border border-gray-300 dark:border-gray-700 rounded-lg">
								{children}
							</table>
						</div>
					),
					thead: ({ children }) => (
						<thead className="bg-gray-50 dark:bg-gray-900/50">{children}</thead>
					),
					th: ({ children }) => (
						<th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">
							{children}
						</th>
					),
					td: ({ children }) => (
						<td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-200">
							{children}
						</td>
					),
					// Enhanced strong/bold text
					strong: ({ children }) => (
						<strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
					),
					// Enhanced emphasis/italic text
					em: ({ children }) => (
						<em className="italic text-gray-800 dark:text-gray-200">{children}</em>
					),
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	)
}

export default MarkdownViewer
