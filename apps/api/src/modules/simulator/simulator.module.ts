// Імпортуємо декоратор Module з NestJS — він створює модуль (блок коду з певною функціональністю)
import { Module } from '@nestjs/common';
// Імпортуємо сервіс симулятора, який буде додавати лоґи
import { SimulatorService } from './simulator.service';

// Декоратор @Module описує модуль та його компоненти
@Module({
  // providers — список сервісів, які будуть доступні в цьому модулі
  providers: [SimulatorService],
})
// Експортуємо клас модуля для використання в інших файлах
export class SimulatorModule {}
