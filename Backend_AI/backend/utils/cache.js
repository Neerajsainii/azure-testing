const now = () => Date.now()
class LruTtlCache {
  constructor({ maxSize = 100, ttlMs = 300000 } = {}) {
    this.maxSize = maxSize
    this.ttlMs = ttlMs
    this.store = new Map()
    this.order = []
  }
  _evictIfNeeded() {
    while (this.order.length > this.maxSize) {
      const k = this.order.shift()
      if (k !== undefined) this.store.delete(k)
    }
  }
  _touch(key) {
    const i = this.order.indexOf(key)
    if (i >= 0) this.order.splice(i, 1)
    this.order.push(key)
  }
  set(key, value) {
    this.store.set(key, { value, ts: now() })
    this._touch(key)
    this._evictIfNeeded()
  }
  get(key) {
    const e = this.store.get(key)
    if (!e) return undefined
    if (this.ttlMs && now() - e.ts > this.ttlMs) {
      this.store.delete(key)
      const i = this.order.indexOf(key)
      if (i >= 0) this.order.splice(i, 1)
      return undefined
    }
    this._touch(key)
    return e.value
  }
  has(key) {
    return this.get(key) !== undefined
  }
  delete(key) {
    this.store.delete(key)
    const i = this.order.indexOf(key)
    if (i >= 0) this.order.splice(i, 1)
  }
  clear() {
    this.store.clear()
    this.order = []
  }
}
module.exports = { LruTtlCache }
