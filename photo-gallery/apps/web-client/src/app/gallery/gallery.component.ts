import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-gallery',
  template: `
    <mdc-image-list masonry class="masonry-image-list">
      <mdc-image-list-item>
        <img mdcImageListImage src="./assets/dog.jpg" />
        <mdc-image-list-supporting>
          <span mdcImageListLabel>Text label</span>
        </mdc-image-list-supporting>
      </mdc-image-list-item>
    </mdc-image-list>
  `,
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
