import { computed, onScopeDispose, ref, watch } from 'vue'

const protectedFields = new Set([
  'name',
  'idx',
  'doctype',
  'parent',
  'parenttype',
  'parentfield',
  'creation',
  'modified',
  'modified_by',
  'owner',
  'docstatus',
  'item_code',
  'qty',
  'amount',
  'rate',
  'uom',
  'custom__is_recurring_item',
])

// Keep item previews separate from hydration and resource dirty/loading state.
export function useItemCalculations(
  document,
  { fetchItem, isBlocked, onError },
) {
  let snapshots = new Map()
  let currentDoc
  let originalDoc
  let generation = 0
  const pending = ref(0)

  onScopeDispose(() => {
    generation++
  })

  function snapshot(row) {
    return { code: row.item_code, qty: row.qty, rate: row.rate }
  }

  function calculate(row) {
    const amount =
      (Number.parseFloat(row.qty) || 0) * (Number.parseFloat(row.rate) || 0)
    if (Math.abs((Number(row.amount) || 0) - amount) > 0.001)
      row.amount = amount
  }

  async function populate(row, state) {
    const doc = document.doc
    const epoch = generation
    const before = { ...row }
    const priceList = doc.selling_price_list || 'Standard Selling'
    const token = Symbol('item-request')
    state.token = token
    pending.value++
    const isCurrent = () =>
      generation === epoch &&
      !isBlocked() &&
      document.doc === doc &&
      doc.items?.includes(row) &&
      row.item_code === state.code &&
      snapshots.get(row)?.token === token &&
      (doc.selling_price_list || 'Standard Selling') === priceList
    try {
      const { item, price } = await fetchItem(state.code, priceList)
      if (!item || !isCurrent()) return
      for (const key of Object.keys(row)) {
        if (protectedFields.has(key) || key.startsWith('_')) continue
        if (item[key] !== undefined && row[key] === before[key])
          row[key] = item[key]
      }
      for (const key of ['item_name', 'description']) {
        if (item[key] !== undefined && row[key] === before[key])
          row[key] = item[key]
      }
      if (
        row.custom__is_recurring_item === before.custom__is_recurring_item &&
        item.custom_is_recurring_item !== undefined
      ) {
        row.custom__is_recurring_item = item.custom_is_recurring_item
      }
      if (row.uom === before.uom) row.uom = item.stock_uom || row.uom
      if (row.rate === before.rate)
        row.rate = price?.price_list_rate ?? item.standard_rate ?? 0
      if (row.qty === undefined || row.qty === null || row.qty === '')
        row.qty = 1
      calculate(row)
    } catch (error) {
      if (isCurrent()) onError?.(error)
    } finally {
      pending.value--
    }
  }

  watch(
    () => [
      document.doc,
      document.originalDoc,
      isBlocked(),
      document.doc?.items?.map(snapshot),
    ],
    () => {
      const doc = document.doc
      const rows = doc?.items || []
      const hydrate = doc !== currentDoc || document.originalDoc !== originalDoc
      currentDoc = doc
      originalDoc = document.originalDoc
      if (hydrate || isBlocked()) {
        generation++
        snapshots = new Map(rows.map((row) => [row, snapshot(row)]))
        return
      }
      const previous = snapshots
      snapshots = new Map()
      for (const row of rows) {
        const old = previous.get(row)
        const state = { ...snapshot(row), token: old?.token }
        snapshots.set(row, state)
        if (row.item_code && (!old || old.code !== row.item_code)) {
          populate(row, state)
        } else if (old && (old.qty !== row.qty || old.rate !== row.rate)) {
          calculate(row)
        }
      }
    },
    { immediate: true },
  )

  return { fetchingItems: computed(() => pending.value > 0) }
}
