import { Component, OnInit } from '@angular/core';
import { Observable, from, forkJoin } from 'rxjs';
import { map, flatMap } from 'rxjs/operators';
import { IMasonryGalleryImage } from 'ngx-masonry-gallery';
import { Storage } from 'aws-amplify';


interface S3Object {
  eTag: string;
  key: string;
  lastModified: Date;
  size: number;
}

@Component({
  selector: 'app-gallery',
  templateUrl: 'gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {
  photoUrls: Observable<IMasonryGalleryImage[]> = new Observable<IMasonryGalleryImage[]>();
  constructor() {}

  refresh() {
    this.photoUrls = this.buildUrls();
  }

  ngOnInit(): void {
    this.refresh();
  }

  buildUrls(): Observable<IMasonryGalleryImage[]> {
    const s3Urls$ = from<Promise<S3Object[]>>(Storage.list('image', { level: 'private'}))
    .pipe(
      map(s3Objects => s3Objects.map(obj => obj.key)),
      map(keys => keys.map(key => from<Promise<string|object>>(Storage.get(key, { level: 'private' })))),
      flatMap(objArray$ => forkJoin(objArray$)),
    );
    return s3Urls$.pipe(
      map(urls => urls.map(url => ({ imageUrl: url } as IMasonryGalleryImage)))
    );
  }
}
