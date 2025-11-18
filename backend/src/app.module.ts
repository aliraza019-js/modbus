import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ModbusModule } from './modbus/modbus.module';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ModbusModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

