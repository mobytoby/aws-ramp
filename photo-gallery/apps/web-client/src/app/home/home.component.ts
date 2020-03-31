import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Auth, Storage } from 'aws-amplify';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalUploadComponent } from '../gallery/modal-upload/modal-upload.component';
import { GalleryComponent } from '../gallery/gallery.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  @ViewChild('gallery', { static: true }) galleryElem: GalleryComponent;
  router: Router;
  isCollapsed = true;
  userName = '';
  userId = '';

  constructor(private modalSvc: NgbModal) {}

  ngOnInit() {
    Auth.currentAuthenticatedUser({
      bypassCache: false
    }).then(async user => {
      this.userId = user.attributes.sub;
      this.userName = user.username;
    })
    .catch(err => console.error(err));
  }

  logOut() {
    Auth.signOut({ global: true })
    .then(() => {
      this.router.navigate(['/auth']);
    })
    .catch(err => console.error(err));
  }

  onUpload() {
    this.modalSvc.open(ModalUploadComponent).result.then(val => {
      this.galleryElem.refresh();
    });
  }

}
