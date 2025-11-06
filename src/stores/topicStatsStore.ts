import { defineStore } from 'pinia'

interface TopicStat {
  id: string
  topic: string
  totalMs: number
  sessionCount: number
  levelName: string
  levelIndex: number
  lastSessionAt: Date | null
}

export const useTopicStatsStore = defineStore('topicStats', {
  state: () => ({
    stats: [] as TopicStat[],
  }),
  actions: {
    setStats(
      topicId: string,
      topicName: string,
      newTotal: number,
      newCount: number,
      newLevel: string,
      newIndex: number,
      lastSessionAt?: Date | null,
    ) {
      const existing = this.stats.find((t) => t.id === topicId)
      if (existing) {
        existing.totalMs = newTotal
        existing.sessionCount = newCount
        existing.levelName = newLevel
        existing.levelIndex = newIndex
        existing.lastSessionAt = lastSessionAt ?? existing.lastSessionAt
      } else {
        this.stats.push({
          id: topicId,
          topic: topicName,
          totalMs: newTotal,
          sessionCount: newCount,
          levelName: newLevel,
          levelIndex: newIndex,
          lastSessionAt: lastSessionAt ?? null,
        })
      }
    },

    getStats(topicId: string) {
      return this.stats.find((t) => t.id === topicId)
    },

    clearAll() {
      this.stats = []
    },
  },
})
