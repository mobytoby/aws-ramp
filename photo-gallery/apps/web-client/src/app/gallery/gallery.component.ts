import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StorageService } from '../storage.service';
import { IMasonryGalleryImage } from 'ngx-masonry-gallery';

@Component({
  selector: 'app-gallery',
  templateUrl: 'gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {
  photoUrls: Observable<IMasonryGalleryImage[]> = new Observable<IMasonryGalleryImage[]>();
  constructor(private svc: StorageService) {}

  refresh() {
    this.photoUrls = this.svc.getPhotos()
      .pipe(map(photos => photos.map(photo => ({ imageUrl: photo.Url } as IMasonryGalleryImage))));
  }

  ngOnInit(): void {
    this.refresh();
  }
}
