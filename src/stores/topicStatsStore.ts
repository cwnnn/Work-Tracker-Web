import { defineStore } from 'pinia'

interface TopicStat {
  id: string
  topic: string
  totalMs: number
  sessionCount: number
  levelName: string
  levelIndex: number
}

export const useTopicStatsStore = defineStore('topicStats', {
  state: () => ({
    stats: [] as TopicStat[],
  }),
  actions: {
    // Yeni veya var olan topic'i güncelle
    setStats(
      topicId: string,
      topicName: string,
      newTotal: number,
      newCount: number,
      newLevel: string,
      newIndex: number,
    ) {
      const existing = this.stats.find((t) => t.id === topicId)
      if (existing) {
        existing.totalMs = newTotal
        existing.sessionCount = newCount
        existing.levelName = newLevel
        existing.levelIndex = newIndex
      } else {
        this.stats.push({
          id: topicId,
          topic: topicName,
          totalMs: newTotal,
          sessionCount: newCount,
          levelName: newLevel,
          levelIndex: newIndex,
        })
      }
    },

    // Belirli topic'in istatistiklerini getir
    getStats(topicId: string) {
      return this.stats.find((t) => t.id === topicId)
    },

    // Tümünü temizle
    clearAll() {
      this.stats = []
    },
  },
})
