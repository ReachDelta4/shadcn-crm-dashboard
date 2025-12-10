import { SupabaseClient } from '@supabase/supabase-js';

type DuplicateCheckInput = {
	email?: string | null;
	phone?: string | null;
	orgId?: string | null;
	ownerIds?: string[] | null;
};

type DuplicateCheckResult = {
	duplicateEmail: boolean;
	duplicatePhone: boolean;
};

const tables = [
	{ name: 'leads', email: 'email', phone: 'phone', deletedCol: 'deleted_at' },
	{ name: 'customers', email: 'email', phone: 'phone' },
	{ name: 'invoices', email: 'email', phone: 'phone' },
	{ name: 'orders', email: 'email', phone: 'phone' },
];

function applyOrgScope(query: any, orgId?: string | null, ownerIds?: string[] | null) {
	if (orgId) {
		return query.eq('org_id', orgId);
	}
	if (ownerIds && ownerIds.length > 0) {
		return query.in('owner_id', ownerIds);
	}
	return query;
}

async function checkOne(
	client: SupabaseClient,
	table: { name: string; email: string; phone: string; deletedCol?: string },
	field: 'email' | 'phone',
	value: string,
	orgId?: string | null,
	ownerIds?: string[] | null,
) {
	let query = client
		.from(table.name)
		.select('id', { head: true, count: 'exact' })
		.eq(field === 'email' ? table.email : table.phone, value);

	query = applyOrgScope(query, orgId, ownerIds);
	if (table.deletedCol) {
		query = query.is(table.deletedCol as any, null);
	}

	const { count, error } = await query.limit(1);
	if (error) throw new Error(`duplicate check failed on ${table.name}: ${error.message}`);
	return (count || 0) > 0;
}

export async function checkDuplicateContact(
	client: SupabaseClient,
	input: DuplicateCheckInput,
): Promise<DuplicateCheckResult> {
	const normalizedEmail = input.email?.trim().toLowerCase() || '';
	const normalizedPhone = input.phone?.trim() || '';

	let duplicateEmail = false;
	let duplicatePhone = false;

	for (const table of tables) {
		if (normalizedEmail && !duplicateEmail) {
			duplicateEmail = await checkOne(client, table, 'email', normalizedEmail, input.orgId, input.ownerIds);
		}
		if (normalizedPhone && !duplicatePhone) {
			duplicatePhone = await checkOne(client, table, 'phone', normalizedPhone, input.orgId, input.ownerIds);
		}
		if (duplicateEmail && duplicatePhone) break;
	}

	return { duplicateEmail, duplicatePhone };
}
