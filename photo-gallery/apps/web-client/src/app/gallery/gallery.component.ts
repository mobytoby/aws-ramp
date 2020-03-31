import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Observable, from, forkJoin } from 'rxjs';
import { map, flatMap } from 'rxjs/operators';
import { IMasonryGalleryImage } from 'ngx-masonry-gallery';
import { Storage } from 'aws-amplify';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ModalFilterSelectionComponent } from './modal-filter-selection/modal-filter-selection.component';


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

  photoUrls: IMasonryGalleryImage[] = [];

  constructor(private modalSvc: NgbModal) {}

  refresh() {
    this.buildUrls().subscribe(res => {
      this.photoUrls = res;
    });
  }

  ngOnInit(): void {
    this.refresh();
  }

  buildUrls(): Observable<IMasonryGalleryImage[]> {
    return from<Promise<S3Object[]>>(Storage.list('image', { level: 'private'}))
    .pipe(
      map(s3Objects => { console.log('s3Objects:', s3Objects); return s3Objects.map(obj => obj.key); }),
      map(keys => keys.map(key => from<Promise<string|object>>(Storage.get(key, { level: 'private' })))),
      flatMap(objArray$ => forkJoin(objArray$)),
      map(urls => urls.map(url => ({ imageUrl: url } as IMasonryGalleryImage)))
    );
  }

  imageClicked(image: IMasonryGalleryImage) {
    const modalRef = this.modalSvc.open(ModalFilterSelectionComponent);
    modalRef.componentInstance.selectedImageSrc = image.imageUrl;
  }
}
