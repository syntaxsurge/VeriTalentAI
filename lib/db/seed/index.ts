import { seedDemoUsers } from './demo-users'
import { seedPlanFeatures } from './plan-features'
import { seedQuizzes } from './quiz'
import { seedStripe } from './stripe'
import { seedUserTeam } from './user-team'

/**
 * Seeds core demo data plus plan features.
 */
async function main() {
  try {
    /* Core users + teams -------------------------------------------------- */
    await seedUserTeam()

    /* Demo users with credentials ---------------------------------------- */
    await seedDemoUsers()

    /* Auxiliary demo data ------------------------------------------------- */
    await Promise.all([await seedStripe(), seedQuizzes(), seedPlanFeatures()])

    console.log('All seeds completed successfully.')
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  } finally {
    console.log('Seed process finished. Exiting…')
    process.exit(0)
  }
}

main()
