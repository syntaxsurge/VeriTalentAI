import { seedQuizzes } from './quiz'
import { seedStripe } from './stripe'
import { seedUserTeam } from './userTeam'

async function main() {
  try {
    await seedUserTeam()
    await seedStripe()
    await seedQuizzes()
    console.log('All seeds completed successfully.')
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  } finally {
    console.log('Seed process finished. Exiting...')
    process.exit(0)
  }
}

main()
