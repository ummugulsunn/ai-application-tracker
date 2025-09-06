/**
 * IndexedDB integration for offline-first data storage
 * Provides a robust, type-safe interface for local data persistence
 */

import { ApplicationInput, UpdateApplicationInput } from './validations'

// Database configuration
const DB_NAME = 'AIApplicationTracker'
const DB_VERSION = 1

// Object store names
export const STORES = {
  APPLICATIONS: 'applications',
  USER_PREFERENCES: 'userPreferences',
  AI_INSIGHTS: 'aiInsights',
  IMPORT_HISTORY: 'importHistory',
  SYNC_QUEUE: 'syncQueue',
} as const

// Database schema interfaces
export interface StoredApplication extends Omit<ApplicationInput, 'appliedDate' | 'responseDate' | 'interviewDate' | 'offerDate' | 'rejectionDate' | 'followUpDate'> {
  id: string
  userId?: string
  appliedDate: string // ISO string for IndexedDB compatibility
  responseDate?: string
  interviewDate?: string
  offerDate?: string
  rejectionDate?: string
  followUpDate?: string
  aiMatchScore?: number
  aiInsights?: any
  createdAt: string
  updatedAt: string
  syncStatus: 'synced' | 'pending' | 'error'
}

export interface UserPreferences {
  id: string
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: {
    email: boolean
    push: boolean
    frequency: 'daily' | 'weekly' | 'never'
  }
  dashboard: {
    layout: 'grid' | 'list'
    defaultView: 'all' | 'pending' | 'active'
    itemsPerPage: number
  }
  accessibility: {
    highContrast: boolean
    reducedMotion: boolean
    fontSize: 'small' | 'medium' | 'large'
  }
  onboarding: {
    completed: boolean
    currentStep: number
    skippedSteps: string[]
  }
  updatedAt: string
}

export interface AIInsightCache {
  id: string
  userId?: string
  analysisType: string
  inputHash: string
  result: any
  confidence: number
  createdAt: string
  expiresAt: string
}

export interface ImportHistoryRecord {
  id: string
  userId?: string
  fileName: string
  fileSize: number
  importedCount: number
  skippedCount: number
  errorCount: number
  fieldMappings: any
  createdAt: string
}

export interface SyncQueueItem {
  id: string
  operation: 'create' | 'update' | 'delete'
  entityType: 'application' | 'preferences' | 'insights'
  entityId: string
  data: any
  attempts: number
  lastAttempt?: string
  createdAt: string
}

// Database connection and initialization
class IndexedDBManager {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        // Server-side rendering - return immediately
        resolve()
        return
      }

      const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Applications store
        if (!db.objectStoreNames.contains(STORES.APPLICATIONS)) {
          const applicationsStore = db.createObjectStore(STORES.APPLICATIONS, { keyPath: 'id' })
          applicationsStore.createIndex('userId', 'userId', { unique: false })
          applicationsStore.createIndex('company', 'company', { unique: false })
          applicationsStore.createIndex('status', 'status', { unique: false })
          applicationsStore.createIndex('appliedDate', 'appliedDate', { unique: false })
          applicationsStore.createIndex('syncStatus', 'syncStatus', { unique: false })
        }

        // User preferences store
        if (!db.objectStoreNames.contains(STORES.USER_PREFERENCES)) {
          db.createObjectStore(STORES.USER_PREFERENCES, { keyPath: 'id' })
        }

        // AI insights cache store
        if (!db.objectStoreNames.contains(STORES.AI_INSIGHTS)) {
          const insightsStore = db.createObjectStore(STORES.AI_INSIGHTS, { keyPath: 'id' })
          insightsStore.createIndex('userId', 'userId', { unique: false })
          insightsStore.createIndex('analysisType', 'analysisType', { unique: false })
          insightsStore.createIndex('inputHash', 'inputHash', { unique: false })
          insightsStore.createIndex('expiresAt', 'expiresAt', { unique: false })
        }

        // Import history store
        if (!db.objectStoreNames.contains(STORES.IMPORT_HISTORY)) {
          const importStore = db.createObjectStore(STORES.IMPORT_HISTORY, { keyPath: 'id' })
          importStore.createIndex('userId', 'userId', { unique: false })
          importStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' })
          syncStore.createIndex('entityType', 'entityType', { unique: false })
          syncStore.createIndex('operation', 'operation', { unique: false })
          syncStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  private async getDB(): Promise<IDBDatabase> {
    await this.init()
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    return this.db
  }

  // Generic CRUD operations
  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAll<T>(storeName: string, indexName?: string, query?: IDBValidKey | IDBKeyRange): Promise<T[]> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const source = indexName ? store.index(indexName) : store
      const request = query ? source.getAll(query) : source.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async put<T>(storeName: string, data: T): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async count(storeName: string, indexName?: string, query?: IDBValidKey | IDBKeyRange): Promise<number> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const source = indexName ? store.index(indexName) : store
      const request = query ? source.count(query) : source.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Batch operations for better performance
  async putMany<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      let completed = 0
      const total = items.length

      if (total === 0) {
        resolve()
        return
      }

      items.forEach((item) => {
        const request = store.put(item)
        request.onsuccess = () => {
          completed++
          if (completed === total) {
            resolve()
          }
        }
        request.onerror = () => reject(request.error)
      })
    })
  }

  async deleteMany(storeName: string, keys: string[]): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      let completed = 0
      const total = keys.length

      if (total === 0) {
        resolve()
        return
      }

      keys.forEach((key) => {
        const request = store.delete(key)
        request.onsuccess = () => {
          completed++
          if (completed === total) {
            resolve()
          }
        }
        request.onerror = () => reject(request.error)
      })
    })
  }
}

// Singleton instance
export const indexedDBManager = new IndexedDBManager()

// Application-specific data access layer
export class ApplicationStorage {
  static async getAll(userId?: string): Promise<StoredApplication[]> {
    if (userId) {
      return indexedDBManager.getAll<StoredApplication>(STORES.APPLICATIONS, 'userId', userId)
    }
    return indexedDBManager.getAll<StoredApplication>(STORES.APPLICATIONS)
  }

  static async getById(id: string): Promise<StoredApplication | undefined> {
    return indexedDBManager.get<StoredApplication>(STORES.APPLICATIONS, id)
  }

  static async create(application: Omit<StoredApplication, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<StoredApplication> {
    const now = new Date().toISOString()
    const storedApplication: StoredApplication = {
      ...application,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    }

    await indexedDBManager.put(STORES.APPLICATIONS, storedApplication)
    
    // Add to sync queue
    await SyncQueue.add({
      operation: 'create',
      entityType: 'application',
      entityId: storedApplication.id,
      data: storedApplication,
    })

    return storedApplication
  }

  static async update(id: string, updates: Partial<StoredApplication>): Promise<StoredApplication | null> {
    const existing = await this.getById(id)
    if (!existing) return null

    const updated: StoredApplication = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
    }

    await indexedDBManager.put(STORES.APPLICATIONS, updated)
    
    // Add to sync queue
    await SyncQueue.add({
      operation: 'update',
      entityType: 'application',
      entityId: id,
      data: updated,
    })

    return updated
  }

  static async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id)
    if (!existing) return false

    await indexedDBManager.delete(STORES.APPLICATIONS, id)
    
    // Add to sync queue
    await SyncQueue.add({
      operation: 'delete',
      entityType: 'application',
      entityId: id,
      data: { id },
    })

    return true
  }

  static async search(query: {
    status?: string[]
    company?: string
    position?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<StoredApplication[]> {
    const applications = await this.getAll()
    
    return applications.filter(app => {
      if (query.status && !query.status.includes(app.status)) return false
      if (query.company && !app.company.toLowerCase().includes(query.company.toLowerCase())) return false
      if (query.position && !app.position.toLowerCase().includes(query.position.toLowerCase())) return false
      if (query.dateFrom && app.appliedDate < query.dateFrom) return false
      if (query.dateTo && app.appliedDate > query.dateTo) return false
      return true
    })
  }

  static async getByStatus(status: string, userId?: string): Promise<StoredApplication[]> {
    const applications = await this.getAll(userId)
    return applications.filter(app => app.status === status)
  }

  static async bulkImport(applications: Omit<StoredApplication, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>[]): Promise<StoredApplication[]> {
    const now = new Date().toISOString()
    const storedApplications: StoredApplication[] = applications.map(app => ({
      ...app,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    }))

    await indexedDBManager.putMany(STORES.APPLICATIONS, storedApplications)
    
    // Add all to sync queue
    for (const app of storedApplications) {
      await SyncQueue.add({
        operation: 'create',
        entityType: 'application',
        entityId: app.id,
        data: app,
      })
    }

    return storedApplications
  }
}

// User preferences storage
export class PreferencesStorage {
  static async get(): Promise<UserPreferences | undefined> {
    return indexedDBManager.get<UserPreferences>(STORES.USER_PREFERENCES, 'default')
  }

  static async set(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const existing = await this.get()
    const updated: UserPreferences = {
      id: 'default',
      theme: 'system',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        frequency: 'weekly',
      },
      dashboard: {
        layout: 'grid',
        defaultView: 'all',
        itemsPerPage: 20,
      },
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        fontSize: 'medium',
      },
      onboarding: {
        completed: false,
        currentStep: 0,
        skippedSteps: [],
      },
      ...existing,
      ...preferences,
      updatedAt: new Date().toISOString(),
    }

    await indexedDBManager.put(STORES.USER_PREFERENCES, updated)
    return updated
  }
}

// AI insights cache
export class AIInsightsCache {
  static async get(inputHash: string): Promise<AIInsightCache | undefined> {
    const insights = await indexedDBManager.getAll<AIInsightCache>(STORES.AI_INSIGHTS, 'inputHash', inputHash)
    const validInsights = insights.filter(insight => new Date(insight.expiresAt) > new Date())
    return validInsights[0]
  }

  static async set(insight: Omit<AIInsightCache, 'id' | 'createdAt'>): Promise<void> {
    const cached: AIInsightCache = {
      ...insight,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await indexedDBManager.put(STORES.AI_INSIGHTS, cached)
  }

  static async cleanup(): Promise<void> {
    const allInsights = await indexedDBManager.getAll<AIInsightCache>(STORES.AI_INSIGHTS)
    const expired = allInsights.filter(insight => new Date(insight.expiresAt) <= new Date())
    const expiredIds = expired.map(insight => insight.id)
    
    if (expiredIds.length > 0) {
      await indexedDBManager.deleteMany(STORES.AI_INSIGHTS, expiredIds)
    }
  }
}

// Sync queue management
export class SyncQueue {
  static async add(item: Omit<SyncQueueItem, 'id' | 'attempts' | 'createdAt'>): Promise<void> {
    const queueItem: SyncQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      attempts: 0,
      createdAt: new Date().toISOString(),
    }
    await indexedDBManager.put(STORES.SYNC_QUEUE, queueItem)
  }

  static async getAll(): Promise<SyncQueueItem[]> {
    return indexedDBManager.getAll<SyncQueueItem>(STORES.SYNC_QUEUE)
  }

  static async markAttempted(id: string): Promise<void> {
    const item = await indexedDBManager.get<SyncQueueItem>(STORES.SYNC_QUEUE, id)
    if (item) {
      item.attempts++
      item.lastAttempt = new Date().toISOString()
      await indexedDBManager.put(STORES.SYNC_QUEUE, item)
    }
  }

  static async remove(id: string): Promise<void> {
    await indexedDBManager.delete(STORES.SYNC_QUEUE, id)
  }

  static async clear(): Promise<void> {
    await indexedDBManager.clear(STORES.SYNC_QUEUE)
  }
}

// Import history tracking
export class ImportHistory {
  static async add(record: Omit<ImportHistoryRecord, 'id' | 'createdAt'>): Promise<void> {
    const historyRecord: ImportHistoryRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await indexedDBManager.put(STORES.IMPORT_HISTORY, historyRecord)
  }

  static async getAll(userId?: string): Promise<ImportHistoryRecord[]> {
    if (userId) {
      return indexedDBManager.getAll<ImportHistoryRecord>(STORES.IMPORT_HISTORY, 'userId', userId)
    }
    return indexedDBManager.getAll<ImportHistoryRecord>(STORES.IMPORT_HISTORY)
  }

  static async getRecent(limit: number = 10): Promise<ImportHistoryRecord[]> {
    const all = await this.getAll()
    return all
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }
}

// Utility functions
export const clearAllData = async (): Promise<void> => {
  await Promise.all([
    indexedDBManager.clear(STORES.APPLICATIONS),
    indexedDBManager.clear(STORES.USER_PREFERENCES),
    indexedDBManager.clear(STORES.AI_INSIGHTS),
    indexedDBManager.clear(STORES.IMPORT_HISTORY),
    indexedDBManager.clear(STORES.SYNC_QUEUE),
  ])
}

export const getStorageStats = async (): Promise<{
  applications: number
  insights: number
  importHistory: number
  syncQueue: number
}> => {
  const [applications, insights, importHistory, syncQueue] = await Promise.all([
    indexedDBManager.count(STORES.APPLICATIONS),
    indexedDBManager.count(STORES.AI_INSIGHTS),
    indexedDBManager.count(STORES.IMPORT_HISTORY),
    indexedDBManager.count(STORES.SYNC_QUEUE),
  ])

  return { applications, insights, importHistory, syncQueue }
}