export function makeQueryMock(result: any = { data: [], error: null, count: 0 }) {
  const q: any = {
    _selectOpts: undefined as any,
    _lastOrFilter: undefined as any,
    select(_cols?: string, opts?: any) {
      ;(this as any)._lastSelectColumns = _cols
      this._selectOpts = opts
      return this
    },
    eq() { return this },
    ilike() { return this },
    or(filter: string) { this._lastOrFilter = filter; return this },
    in() { return this },
    is() { return this },
    not() { return this },
    gte() { return this },
    lte() { return this },
    order() { return this },
    range() { return this },
    // Make awaitable
    then(resolve: any) { resolve(result) },
  }
  return q
}

export function makeClientMock(tables: string[] = []) {
  const q = makeQueryMock()
  const client = {
    from(table: string) {
      if (!tables.includes(table)) tables.push(table)
      return q
    }
  } as any
  return { client, query: q, tables }
}
