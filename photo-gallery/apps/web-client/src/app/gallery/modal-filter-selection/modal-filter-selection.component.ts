import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { APIService } from 'src/app/api.service';
import { from } from 'rxjs';

interface FilterType {
  id: string;
  name: string;
  disabled: boolean;
}

@Component({
  selector: 'app-modal-filter-selection',
  template: `
    <div class="modal-header">
      <h4 class="modal-title" id="modal-basic-title">Apply Image Filter</h4>
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
      <div class="row">
        <div class="col-sm-6">
          <img
            src="{{ selectedImageSrc }}"
            class="img-fluid"
            alt="Responsive image"
          />
        </div>
        <div class="col-sm-6">
          <form>
            <div class="form-group">
              <div *ngFor="let filterType of filters" class="col">
                <div class="custom-control custom-radio">
                  <input
                    type="radio"
                    [id]="filterType.id"
                    name="customRadio"
                    class="custom-control-input"
                    [value]="filterType.id"
                    [(ngModel)]="processor"
                  >
                  <label class="custom-control-label" [for]="filterType.id">
                    {{filterType.name}}
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button
        ngbAutofocus
        type="button"
        class="btn btn-outline-dark"
        (click)="onApply()"
      >
        Apply Filter
      </button>
    </div>
  `,
  styles: [],
})
export class ModalFilterSelectionComponent implements OnInit {
  @Input() selectedImageSrc: string;
  filters: FilterType[] = [
    { id: 'zoom-in', name: 'Zoom In', disabled: true },
    {
      id: 'enhance',
      name: 'Enhance',
      disabled: false,
    },
    { id: 'zoom-out', name: 'Zoom Out', disabled: false },
  ];
  jobName = '';
  processor = '';

  constructor(public activeModal: NgbActiveModal, private apiSvc: APIService) {}

  onApply() {
    const name = new Date().toTimeString();
    from(
      this.apiSvc.CreateImageJob({
        name,
        processor: this.processor,
        imageUrl: this.getS3BucketName(this.selectedImageSrc),
      })
    ).subscribe(
      (res) => {
        alert('Job submitted successfully');
        console.log(res);
      },
      (err) => {
        alert('Error submitting job');
        console.error(err);
      }
    );
    this.activeModal.close();
  }

  getS3BucketName(url: string): string {
    const loc = url.indexOf('?');
    return url.substring(0, loc);
  }
  ngOnInit() {}
}
