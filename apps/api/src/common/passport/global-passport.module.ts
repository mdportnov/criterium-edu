import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

/**
 * JwtAuthGuard is applied with @UseGuards in fourteen modules. From
 * @nestjs/passport 12 the guard resolves AuthModuleOptions through DI, so
 * PassportModule has to be reachable from every one of them. Exporting it from
 * a global module registered first is the one place to say that.
 */
@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  exports: [PassportModule],
})
export class GlobalPassportModule {}
