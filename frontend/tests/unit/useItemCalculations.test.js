import { effectScope, nextTick, reactive, ref } from 'vue'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useItemCalculations } from '@/composables/useItemCalculations'

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

let scope
let document
let fetchItem
let blocked
let state
let onError

beforeEach(() => {
  scope = effectScope()
  blocked = ref(false)
  const doc = {
    docstatus: 0,
    items: [
      {
        name: 'row',
        doctype: 'Quotation Item',
        item_code: 'old',
        qty: 2,
        rate: 5,
        amount: 10,
      },
    ],
  }
  document = reactive({
    doc,
    originalDoc: structuredClone(doc),
    save: { loading: false },
    isDirty: false,
  })
  fetchItem = vi
    .fn()
    .mockResolvedValue({
      item: {
        item_name: 'New',
        standard_rate: 8,
        stock_uom: 'Nos',
        custom_is_recurring_item: 1,
      },
      price: null,
    })
  onError = vi.fn()
  state = scope.run(() =>
    useItemCalculations(document, {
      fetchItem,
      isBlocked: () => blocked.value,
      onError,
    }),
  )
})
afterEach(() => scope.stop())

it('does not refetch or dirty hydrated server rows', async () => {
  await nextTick()
  expect(fetchItem).not.toHaveBeenCalled()
  expect(document.isDirty).toBe(false)
  expect(document.doc).toEqual(document.originalDoc)
})

it('fetches item changes and preserves custom recurring metadata', async () => {
  const row = document.doc.items[0]
  row.item_code = 'new'
  await nextTick()
  await flushPromises()
  expect(fetchItem).toHaveBeenCalledOnce()
  expect(fetchItem).toHaveBeenCalledWith('new', 'Standard Selling')
  expect(row).toMatchObject({
    name: 'row',
    doctype: 'Quotation Item',
    item_name: 'New',
    qty: 2,
    rate: 8,
    amount: 16,
    uom: 'Nos',
    custom__is_recurring_item: 1,
  })
  expect(row.__item_fetched).toBeUndefined()
  expect(state.fetchingItems.value).toBe(false)
})

it('recalculates quantity and rate changes without refetching', async () => {
  document.doc.items[0].qty = 3
  await nextTick()
  expect(document.doc.items[0].amount).toBe(15)
  expect(fetchItem).not.toHaveBeenCalled()
  expect(document.save.loading).toBe(false)
})

it('does not change values while saving, enriching, or read-only', async () => {
  blocked.value = true
  document.save.loading = true
  document.doc.items[0].item_code = 'blocked'
  document.doc.items[0].qty = 5
  await nextTick()
  blocked.value = false
  await nextTick()
  expect(fetchItem).not.toHaveBeenCalled()
  expect(document.doc.items[0].amount).toBe(10)
  expect(document.save.loading).toBe(true)
})

it('ignores an old item response after a second selection', async () => {
  let resolveFirst
  fetchItem.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveFirst = resolve
      }),
  )
  const row = document.doc.items[0]
  row.item_code = 'first'
  await nextTick()
  expect(state.fetchingItems.value).toBe(true)
  row.item_code = 'second'
  await nextTick()
  await flushPromises()
  resolveFirst({ item: { standard_rate: 999, item_name: 'Stale' } })
  await flushPromises()
  expect(row.rate).toBe(8)
  expect(row.item_name).toBe('New')
})

it('does not overwrite manual pricing while an item lookup is pending', async () => {
  let resolve
  fetchItem.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  const row = document.doc.items[0]
  row.item_code = 'new'
  await nextTick()
  row.rate = 42
  await nextTick()
  resolve({ item: { standard_rate: 8 } })
  await flushPromises()
  expect(row.rate).toBe(42)
  expect(row.amount).toBe(84)
})

it.each(['reload', 'remove', 'block', 'unmount'])(
  'discards late responses after %s',
  async (action) => {
    let resolve
    fetchItem.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const row = document.doc.items[0]
    row.item_code = 'pending'
    await nextTick()
    if (action === 'reload')
      document.doc = JSON.parse(JSON.stringify(document.originalDoc))
    if (action === 'remove') document.doc.items = []
    if (action === 'block') blocked.value = true
    if (action === 'unmount') scope.stop()
    await nextTick()
    resolve({ item: { standard_rate: 999 } })
    await flushPromises()
    expect(row.rate).toBe(5)
  },
)

it('keeps a zero price and zero quantity', async () => {
  fetchItem.mockResolvedValue({
    item: { standard_rate: 100 },
    price: { price_list_rate: 0 },
  })
  document.doc.items.push({ item_code: 'free', qty: 0 })
  await nextTick()
  await flushPromises()
  expect(document.doc.items[1]).toMatchObject({ qty: 0, rate: 0 })
})

it('handles documents without items', async () => {
  document.doc = { docstatus: 0 }
  await expect(nextTick()).resolves.not.toThrow()
  expect(fetchItem).not.toHaveBeenCalled()
})

it('reports lookup failures without changing the resource state', async () => {
  const error = new Error('Not permitted')
  fetchItem.mockRejectedValue(error)
  document.doc.items[0].item_code = 'private'
  await nextTick()
  await flushPromises()
  expect(onError).toHaveBeenCalledWith(error)
  expect(state.fetchingItems.value).toBe(false)
  expect(document.isDirty).toBe(false)
})
