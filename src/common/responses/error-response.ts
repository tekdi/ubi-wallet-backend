import { Expose } from 'class-transformer';

export class ErrorResponse {
  @Expose()
  statusCode: number;

  @Expose()
  errorMessage: string;

  constructor(partial: Partial<ErrorResponse>) {
    Object.assign(this, partial);
  }
}
