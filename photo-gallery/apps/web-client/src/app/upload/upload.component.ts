import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { APIService } from '../api.service';
import { StorageService } from '../storage.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnInit {
  @Output() uploaded = new EventEmitter<boolean>();
  constructor(
    private apiSvc: APIService,
    private storageSvc: StorageService
  ) {}
  files: File[] = [];
  applyFilter = false;
  onSelect(event) {
    console.log(event);
    this.files.push(...event.addedFiles);
  }

  onCancel(event) {
    console.log(event);
    this.files = [];
  }

  async onImageUploaded(e) {
    console.log(e);
  }

  onSubmit() {
    const file = this.files[0];
    this.files = [];
  }

  storeFile(file: File) {
  }

  onSuccess(res: any) {
    this.files = [];
  }

  ngOnInit(): void {}
}
