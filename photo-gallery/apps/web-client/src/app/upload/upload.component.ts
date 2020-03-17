import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: [
    './upload.component.scss',
    // './debug.scss',
  ]
})
export class UploadComponent implements OnInit {
  @Output() uploaded = new EventEmitter<boolean>();
  constructor(private svc: ApiService) {}
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

  onSubmit() {
    const file = this.files[0];
    if (this.applyFilter) {
      this.svc.applyGreyscale(file).subscribe (
        (res) => {
          const gsImage = new File([res.body], file.name, {type: file.type});
          this.handleFilterResponse(gsImage);
        },
        (err) => console.log(err)
      );
    } else {
      this.handleFilterResponse(file);
    }
    this.files = [];
  }

  handleFilterResponse(file: File) {
    this.svc.storeFile(file).subscribe(
      (res) =>
      {
        console.log(res);
        this.uploaded.emit(true);
      },
      (err) => console.error(err)
    );
  }

  onSuccess(res: any) {
    this.files = [];
  }

  ngOnInit(): void {}
}
