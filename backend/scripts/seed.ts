import 'reflect-metadata';
import dataSource from '../src/database/data-source';
import { Patient } from '../src/database/entities/patient.entity';
import { Sex } from '../src/common/enums/sex.enum';

/**
 * Idempotent demo seed: inserts 2 patients only if the table is empty, so
 * re-running never creates duplicates. Run with `npm run seed`.
 */
async function seed() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(Patient);

  const existing = await repo.count();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} patient(s) already present.`);
    await dataSource.destroy();
    return;
  }

  await repo.save([
    repo.create({
      first_name: 'Maria',
      last_name: 'Garcia',
      date_of_birth: '1978-11-02',
      sex: Sex.Female,
      phone_number: '3055550148',
      email: 'maria.garcia@example.com',
      address_line_1: '742 Ocean Drive',
      city: 'Miami',
      state: 'FL',
      zip_code: '33139',
      preferred_language: 'Spanish',
      insurance_provider: 'Blue Cross',
      insurance_member_id: 'BC123456789',
    }),
    repo.create({
      first_name: 'James',
      last_name: 'Nguyen',
      date_of_birth: '1990-06-21',
      sex: Sex.Male,
      phone_number: '2065550193',
      address_line_1: '400 Pine Street',
      address_line_2: 'Apt 12B',
      city: 'Seattle',
      state: 'WA',
      zip_code: '98101',
    }),
  ]);

  console.log('Seeded 2 demo patients.');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
