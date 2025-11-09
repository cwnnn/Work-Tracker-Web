import { defineStore } from 'pinia'

interface AllTopicStats {
  totalFocusMs: number
  sessionCount: number
  avgDailyFocusMs?: number
  peakFocusSession?: number
  focusStreak?: number
  lastUpdate?: Date | null
}

export const useAllTopicStatsStore = defineStore('allTopics', {
  state: () => ({
    stats: {
      totalFocusMs: 0,
      sessionCount: 0,
      avgDailyFocusMs: 0,
      peakFocusSession: 0,
      focusStreak: 0,
      lastUpdate: null,
    } as AllTopicStats,
  }),

  actions: {
    setStats(newStats: Partial<AllTopicStats>) {
      this.stats = { ...this.stats, ...newStats, lastUpdate: new Date() }
    },

    getStats(): AllTopicStats {
      return this.stats
    },
  },
})
