import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../environments/environment';
import { Photo } from './entities/photo';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  storageUrl: string = environment.storageUrl;
  filterUrl: string = environment.filterUrl;
  bucketName: string = environment.bucketName;

  constructor(private http: HttpClient) { }

  get photos() {
    return this.http.get<Photo>(`${this.storageUrl}/bucket/${this.bucketName}/photos`);
  }

  applyGreyscale(file: File) {
    return this.http.post<File>(this.filterUrl, file);
  }

  storeFile(file: File) {
    const filename = file.name;
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<File>(`${this.storageUrl}/bucket/${this.bucketName}/photos/${filename}`, formData);
  }
}
