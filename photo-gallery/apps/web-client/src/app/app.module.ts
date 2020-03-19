import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { NgxDropzoneModule } from 'ngx-dropzone';
import { NgxMasonryModule } from 'ngx-masonry';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GalleryComponent } from './gallery/gallery.component';
// import { MaterialModule } from './material.module';
import { UploadComponent } from './upload/upload.component';

@NgModule({
  declarations: [AppComponent, GalleryComponent, UploadComponent],
  imports: [
    BrowserAnimationsModule,
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    FormsModule,
    HttpClientModule,
    NgxDropzoneModule,
    NgxMasonryModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
