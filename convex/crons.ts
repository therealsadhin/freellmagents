import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Hourly repository sync, off the hour (AGENTS.md sections 6/23).
crons.hourly('hourly github sync', { minuteUTC: 7 }, internal.sync.runSync, {
  trigger: 'cron',
})

export default crons
