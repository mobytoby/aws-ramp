import { Component, OnInit, EventEmitter, Output } from '@angular/core';

import { Storage } from 'aws-amplify';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { from } from 'rxjs';
import { APIService } from 'src/app/api.service';

@Component({
  selector: 'app-modal-upload',
  template: `
    <div class="modal-header">
      <h4 class="modal-title" id="modal-basic-title">Upload Image to S3</h4>
      <button
        type="button"
        class="close"
        aria-label="Close"
        (click)="activeModal.dismiss('Cross click')"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <div class="col p-3">
        <ngx-dropzone [multiple]="false" (change)="onSelect($event)">
          <ngx-dropzone-label>Drop or click to upload</ngx-dropzone-label>
          <ngx-dropzone-image-preview
            ngProjectAs="ngx-dropzone-preview"
            *ngFor="let f of files"
            [file]="f"
          >
          </ngx-dropzone-image-preview>
        </ngx-dropzone>
      </div>
    </div>
    <div class="modal-footer text-center">
      <button
        ngbAutofocus
        type="button"
        (click)="onSubmit()"
        class="mr-1 btn btn-primary"
      >
        Submit
      </button>
      <button type="button" (click)="onCancel()" class="btn btn-secondary">
        Cancel
      </button>
    </div>
  `,
  styles: []
})
export class ModalUploadComponent implements OnInit {
  @Output() uploaded = new EventEmitter<boolean>();

  constructor(
    public activeModal: NgbActiveModal,
    private apiSvc: APIService
  ) {}

  files: File[] = [];

  onSelect(event) {
    this.files.push(...event.addedFiles);
  }

  resetFiles() {
    this.files = [];
  }

  onCancel() {
    this.resetFiles();
  }

  get file(): File | null {
    return this.files && this.files.length > 0 && this.files[0];
  }

  onSubmit() {
    this.storeFile(this.file);
    this.resetFiles();
  }

  storeFile(file: File) {
    from(
      Storage.put(`image/${file.name}`, file, { level: 'private' })
    ).subscribe(
      res => {
        this.handleSuccess(res);
      },
      err => {
        console.error(err);
        this.activeModal.close();
      }
    );
  }

  handleSuccess(res: any) {
    console.log('Storage:Put', res);
    this.uploaded.emit(true);
    this.activeModal.close();
    // this.apiSvc.CreateImageJob({
    //   new
    // })
  }

  ngOnInit() {}
}
