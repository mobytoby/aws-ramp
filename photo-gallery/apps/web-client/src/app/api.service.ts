import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Photo } from './entities/photo';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  apiUrl: string = 'http://localhost:8080/';
  bucketName: string = 's3-photos-undefined-28670871-e0b4-47f7-bfaf-2507402e2e5a';

  constructor(private http: HttpClient) { }

  get Photos() {
    return this.http.get<Photo>(`${this.apiUrl}/bucket/${this.bucketName}/photos`);
  }
}
