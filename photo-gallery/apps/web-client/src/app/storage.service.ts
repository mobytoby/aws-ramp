import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Photo } from './entities/photo';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  storageUrl: string = environment.storageUrl;
  filterUrl: string = environment.filterUrl;
  bucketName: string = environment.bucketName;

  constructor(private http: HttpClient) { }

  getPhotos() {
    return this.http.get<Photo[]>(`${this.storageUrl}/bucket/${this.bucketName}/photos`);
  }

  applyGreyscale(file: File): Observable<HttpResponse<Blob>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.filterUrl}/greyscale`, formData, { observe: 'response', responseType: 'blob'});
  }

  storeFile(file: File) {
    const filename = file.name;
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.storageUrl}/bucket/${this.bucketName}/photos/${filename}`, formData);
  }
}
