import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { APIService } from '../api.service';
import { Storage } from 'aws-amplify';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnInit {
  @Output() uploaded = new EventEmitter<boolean>();
  constructor(
    private apiSvc: APIService,
  ) {}
  files: File[] = [];
  applyFilter = false;
  onSelect(event) {
    this.files.push(...event.addedFiles);
  }

  onCancel() {
    this.files = [];
  }

  onSubmit() {
    const file = this.files[0];
    this.storeFile(file);
    this.files = [];
  }

  async storeFile(file: File) {
    Storage.put(`image/${file.name}`,
                file,
                { level: 'private'})
    .then(() => {
      this.uploaded.emit(true);
    })
    .catch(err => console.error(err));
  }

  onSuccess(res: any) {
    this.files = [];
  }

  ngOnInit(): void {}
}
