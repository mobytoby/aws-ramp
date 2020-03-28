import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { NgxDropzoneModule } from 'ngx-dropzone';
import { MasonryGalleryModule } from 'ngx-masonry-gallery';

import { AmplifyAngularModule, AmplifyService } from 'aws-amplify-angular';

import { AppComponent } from './app.component';
import { GalleryComponent } from './gallery/gallery.component';
import { UploadComponent } from './upload/upload.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthComponent } from './auth/auth.component';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [AppComponent, GalleryComponent, UploadComponent, AuthComponent, HomeComponent],
  imports: [
    AmplifyAngularModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    MasonryGalleryModule,
    NgbModule,
    NgxDropzoneModule,
  ],
  providers: [AmplifyService],
  bootstrap: [AppComponent],
})
export class AppModule {}
