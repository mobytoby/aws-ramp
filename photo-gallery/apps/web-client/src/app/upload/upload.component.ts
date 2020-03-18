import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
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
    // Feels like there should be a better way to do this.
    // Like make a pipe of these filters and apply withouth the if
    if (this.applyFilter) {
      this.svc.applyGreyscale(file).subscribe (
        (res) => {
          const gsImage = new File([res.body], file.name, {type: file.type});
          this.storeFile(gsImage);
        },
        (err) => console.log(err)
      );
    } else {
      this.storeFile(file);
    }
    this.files = [];
  }

  storeFile(file: File) {
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
