import dataSource from './data-source';

/**
 * Runs pending migrations under a Postgres advisory lock.
 *
 * `typeorm migration:run` reads the migrations table, then applies what is
 * missing. Two containers starting together - a rolling deploy, or simply two
 * replicas - both read "nothing applied" and both apply the same migration.
 * The lock makes the second one wait and then find nothing left to do.
 *
 * The key is an arbitrary constant; it only has to be the same in every
 * process that migrates this database.
 */
const ADVISORY_LOCK_KEY = 4_815_162_342;

async function migrate(): Promise<void> {
  await dataSource.initialize();

  try {
    await dataSource.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);

    try {
      const applied = await dataSource.runMigrations({ transaction: 'each' });

      if (applied.length === 0) {
        console.log('No pending migrations.');
      } else {
        console.log(
          `Applied ${applied.length} migration(s): ${applied
            .map((migration) => migration.name)
            .join(', ')}`,
        );
      }
    } finally {
      await dataSource.query('SELECT pg_advisory_unlock($1)', [
        ADVISORY_LOCK_KEY,
      ]);
    }
  } finally {
    await dataSource.destroy();
  }
}

migrate().catch((error: unknown) => {
  console.error(
    'Migration failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
