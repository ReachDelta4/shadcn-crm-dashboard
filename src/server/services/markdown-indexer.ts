import type { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

function normalizeNewlines(s: string): string {
  return (s || '').replace(/\r\n?/g, '\n')
}

export type Section = {
  slug_path: string
  level: number
  title: string
  content_markdown: string
  start_line: number
  end_line: number
}

function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function extractSections(markdown: string, root: 'executive_summary' | 'chance_of_sale'): Section[] {
  const text = normalizeNewlines(markdown)
  const lines = text.split('\n')
  const sections: Section[] = []

  type StackNode = { level: number; title: string; slug: string; start: number }
  const stack: StackNode[] = []

  const flush = (startIndex: number, endIndex: number) => {
    if (stack.length === 0) return
    const node = stack[stack.length - 1]
    const title = node.title
    const level = node.level
    const pathSlugs = [root, ...stack.map(s => s.slug)]
    const slug_path = pathSlugs.join('/')
    const content_markdown = lines.slice(startIndex, endIndex).join('\n')
    sections.push({ slug_path, level, title, content_markdown, start_line: startIndex + 1, end_line: endIndex + 1 })
  }

  // We capture content for each heading until the next heading of same or higher level
  let contentStart = 0
  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{1,6})\s+(.*)$/.exec(lines[i])
    if (!m) continue
    const level = m[1].length
    const title = m[2].trim()
    // Close previous node
    if (stack.length > 0) {
      flush(contentStart, i - 1)
    }
    // Adjust stack to current level
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }
    const slug = slugify(title)
    stack.push({ level, title, slug, start: i })
    contentStart = i + 1
  }
  // Flush last
  if (stack.length > 0) {
    flush(contentStart, lines.length - 1)
  }
  return sections
}

function extractTabSegment(all: string, tab: 'exec' | 'chance'): string | undefined {
  const text = normalizeNewlines(all)
  const parts = text.split(/(```[\s\S]*?```)/g)
  const mkStart = (name: string) => new RegExp(`<!--\\s*TAB:\\s*${name}\\s*-->`, 'i')
  const mkEnd = (name: string) => new RegExp(`<!--\\s*\\/\\s*TAB:\\s*${name}\\s*-->`, 'i')
  const startExec = mkStart('EXECUTIVE\\s+SUMMARY')
  const endExec = mkEnd('EXECUTIVE\\s+SUMMARY')
  const startChance = mkStart('CHANCE\\s+OF\\s+SALE')
  const endChance = mkEnd('CHANCE\\s+OF\\s+SALE')

  let cur: 'none' | 'exec' | 'chance' = 'none'
  const out: string[] = []
  for (const part of parts) {
    if (part.startsWith('```')) {
      if (cur !== 'none') out.push(part)
      continue
    }
    const isStartExec = startExec.test(part)
    const isEndExec = endExec.test(part)
    const isStartChance = startChance.test(part)
    const isEndChance = endChance.test(part)

    if (isStartExec || isStartChance || isEndExec || isEndChance) {
      // strip markers
      const cleaned = part
        .replace(startExec, '')
        .replace(endExec, '')
        .replace(startChance, '')
        .replace(endChance, '')
      if (cleaned && cur !== 'none') out.push(cleaned)
      if (isStartExec) cur = 'exec'
      else if (isStartChance) cur = 'chance'
      else if (isEndExec && cur === 'exec') cur = 'none'
      else if (isEndChance && cur === 'chance') cur = 'none'
      continue
    }
    if (cur !== 'none') out.push(part)
  }
  const combined = out.join('')
  const trimmed = combined.replace(/^\n+|\s+$/g, '').trim()
  if (!trimmed) return undefined
  return trimmed
}

export async function indexReportMarkdown(
  supabase: SupabaseClient,
  sessionId: string,
  allMarkdown: string
): Promise<void> {
  const execMd = extractTabSegment(allMarkdown, 'exec')
  const chanceMd = extractTabSegment(allMarkdown, 'chance')

  // Delete only the roots we will re-insert
  const rootsToReplace: Array<'executive_summary' | 'chance_of_sale'> = []
  if (execMd) rootsToReplace.push('executive_summary')
  if (chanceMd) rootsToReplace.push('chance_of_sale')
  for (const root of rootsToReplace) {
    await (supabase as any)
      .from('report_sections')
      .delete()
      .eq('session_id', sessionId)
      .eq('report_kind', 'tabs')
      .like('slug_path', `${root}%`)
      .then(() => {}, () => {})
  }

  const rows: any[] = []
  const pushSections = (md: string, root: 'executive_summary'|'chance_of_sale') => {
    // Prefer SECTION anchor parsing for deterministic paths; fallback to heading-based
    const anchorRegex = /<!--\s*SECTION:\s*([A-Z0-9_\/\-]+)\s*-->[\s\S]*?<!--\s*\/SECTION:\s*\1\s*-->/g
    const blocks: Array<{ id: string; content: string }> = []
    let m: RegExpExecArray | null
    while ((m = anchorRegex.exec(md)) !== null) {
      const id = m[1]
      const full = m[0]
      const inner = full
        .replace(new RegExp(`<!--\\s*SECTION:\\s*${id}\\s*-->`), '')
        .replace(new RegExp(`<!--\\s*\\/SECTION:\\s*${id}\\s*-->`), '')
      blocks.push({ id, content: inner })
    }
    if (blocks.length > 0) {
      for (const b of blocks) {
        rows.push({
          session_id: sessionId,
          report_kind: 'tabs',
          node_id: randomUUID(),
          slug_path: `${root}/${b.id}`,
          level: 2,
          title: b.id,
          content_markdown: normalizeNewlines(b.content).trim(),
          start_line: 0,
          end_line: 0,
        })
      }
    } else {
      const secs = extractSections(md, root)
      for (const s of secs) {
        rows.push({
          session_id: sessionId,
          report_kind: 'tabs',
          node_id: randomUUID(),
          slug_path: s.slug_path,
          level: s.level,
          title: s.title,
          content_markdown: s.content_markdown,
          start_line: s.start_line,
          end_line: s.end_line,
        })
      }
    }
  }

  if (execMd) pushSections(execMd, 'executive_summary')
  if (chanceMd) pushSections(chanceMd, 'chance_of_sale')

  if (rows.length > 0) {
    await (supabase as any).from('report_sections').insert(rows).then(() => {}, () => {})
  }
}
