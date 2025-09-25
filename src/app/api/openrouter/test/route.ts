import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
	try {
		const headers: Record<string,string> = {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
		}
		if (process.env.OPENROUTER_HTTP_REFERER) headers['HTTP-Referer'] = process.env.OPENROUTER_HTTP_REFERER
		if (process.env.OPENROUTER_X_TITLE) headers['X-Title'] = process.env.OPENROUTER_X_TITLE

		const body = {
			model: 'qwen/qwen3-235b-a22b:free',
			messages: [
				{ role: 'system', content: 'Return ONLY JSON matching the schema' },
				{ role: 'user', content: 'Give a short exec headline and 2 bullets.' }
			],
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: 'TestProbe',
					strict: true,
					schema: {
						type: 'object',
						additionalProperties: false,
						required: ['headline', 'bullets'],
						properties: {
							headline: { type: 'string' },
							bullets: { type: 'array', items: { type: 'string' } }
						}
					}
				}
			},
			provider: { sort: 'price' },
			temperature: 0.2,
			max_tokens: 600,
		}

		const res = await fetch('https://openrouter.ai/api/v1/chat/completions', { 
			method: 'POST', 
			headers, 
			body: JSON.stringify(body) 
		})
		
		const text = await res.text()
		let parsed: any = null
		try { parsed = JSON.parse(text) } catch {}
		
		return NextResponse.json({ 
			ok: res.ok, 
			status: res.status, 
			headers: Object.fromEntries(res.headers.entries()),
			raw: parsed || text 
		})
	} catch (e) {
		return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
	}
}



















