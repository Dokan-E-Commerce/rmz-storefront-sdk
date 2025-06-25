import { HttpClient } from '../utils/http-client';

export abstract class BaseService {
  protected http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }
}