import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Wires TypeORM to Postgres using validated config.
 *
 * `synchronize` is config-driven: convenient (true) for local dev so the
 * schema tracks the entities automatically, but off in production where the
 * checked-in migration (see data-source.ts) is the source of truth. Either
 * way, `synchronize` never drops data — it only reconciles schema.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('db.host'),
        port: config.get<number>('db.port'),
        username: config.get<string>('db.username'),
        password: config.get<string>('db.password'),
        database: config.get<string>('db.database'),
        synchronize: config.get<boolean>('db.synchronize'),
        autoLoadEntities: true,
        entities: [`${__dirname}/entities/**.entity.{js,ts}`],
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
