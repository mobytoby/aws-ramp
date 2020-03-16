import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: [
    './upload.component.scss',
    // './debug.scss',
  ]
})
export class UploadComponent implements OnInit {
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
    const source = this.applyFilter ?
      this.svc.applyGreyscale(file) :
      of(file);
    source.pipe(
      map(f => this.svc.storeFile(f))
    ).subscribe(
      (res) => this.onSuccess(res),
      (err) => console.error(err),
    );
    this.files = [];
  }

  onSuccess(res: any) {
    this.files = [];
    alert('Successfully uploaded');
  }

  ngOnInit(): void {}
}
