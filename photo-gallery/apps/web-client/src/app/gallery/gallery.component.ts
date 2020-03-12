import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable } from 'rxjs';
import { Photo } from '../entities/photo';

@Component({
  selector: 'app-gallery',
  template: `
    <div class="demo-content">
      <h3>Masonry Image List</h3>
      <div class="demo-content--row">
        <button
          mdc-button
          (click)="demomasonry.textProtection = !demomasonry.textProtection"
        >
          Text Protection: {{ demomasonry.textProtection ? "On" : "Off" }}
        </button>
      </div>
      <mdc-image-list #demomasonry [masonry]="true" class="masonry-image-list">
        <mdc-image-list-item *ngFor="let item of photos | async">
          <img mdcImageListImage src="{{ item.Url }}" />
          <mdc-image-list-supporting>
            <span mdcImageListLabel>Text label</span>
          </mdc-image-list-supporting>
        </mdc-image-list-item>
      </mdc-image-list>
    </div>
  `,
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {
  photos: Observable<Photo> = new Observable<Photo>();

  constructor(private svc: ApiService) {}

  ngOnInit(): void {
    this.photos = this.svc.Photos;
  }
}
