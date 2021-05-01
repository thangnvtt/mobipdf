import * as LRU from 'lru-cache'

export class Cache {
    private cache

    private getLRU() {
        if (this.cache) return this.cache

        const option = {
            maxAge: 24 * 60 * 60 * 1000
        }
        this.cache = new LRU(option)
        return this.cache
    }

    set(key: string, value: any): any {
        const cache = this.getLRU()
        cache.set(key, value)
    }

    get(key: string) {
        const cache = this.getLRU()
        return cache.get(key)
    }
}
