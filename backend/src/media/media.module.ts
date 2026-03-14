import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { OmdbService } from './external/omdb.service';
import { GoogleBooksService } from './external/google-books.service';

@Module({
  imports: [HttpModule],
  providers: [MediaService, OmdbService, GoogleBooksService],
  controllers: [MediaController],
})
export class MediaModule {}
