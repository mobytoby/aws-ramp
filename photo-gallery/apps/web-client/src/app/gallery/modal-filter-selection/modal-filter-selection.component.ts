import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { APIService } from 'src/app/api.service';
import { from } from 'rxjs';

interface FilterType {
  id: string;
  name: string;
  disabled: boolean;
  checked: boolean;
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
                <div class="form-check">
                  <input
                    class="form-check-input"
                    name="filters"
                    type="checkbox"
                    [(ngModel)]="filterType.checked"
                    [id]="filterType.id"
                    [disabled]="filterType.disabled"
                  />
                  <label class="form-check-label" [for]="filterType.id">
                    {{ filterType.name }}
                  </label>
                </div>
              </div>
            </div>
            <div class="form-group">
              <input
                type="text"
                class="form-control"
                [(ngModel)]="jobName"
                name="jobName"
                id="jobName"
                aria-describedby="jobFilterName"
                placeholder="Job Name"
              />
              <small id="jobNameHelp" class="form-text text-muted"
                >Enter a friendly name for this image processing job.</small
              >
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
  styles: []
})
export class ModalFilterSelectionComponent implements OnInit {
  @Input() selectedImageSrc: string;
  filters: FilterType[] = [
    { id: 'greyscale', name: 'Greyscale', disabled: false, checked: false },
    { id: 'cartoon', name: 'Cartoon', disabled: false, checked: false },
    { id: 'saturate', name: 'Saturate', disabled: false, checked: false }
  ];
  jobName = '';

  constructor(public activeModal: NgbActiveModal, private apiSvc: APIService) {}

  onApply() {
    const selectedFilters = this.applifedFilters;
    console.log('Filters:', selectedFilters);
    from(
      this.apiSvc.CreateImageJob({
        filters: selectedFilters,
        name: this.jobName,
        imageUrl: this.getS3BucketName(this.selectedImageSrc)
      })
    ).subscribe(
      res => {
        alert('Job submitted successfully');
        console.log(res);
      },
      err => {
        alert('Error submitting job');
        console.error(err);
      }
    );
    this.activeModal.close();
  }

  get applifedFilters(): string[] {
    return this.filters.filter(f => f.checked).map(f => f.id);
  }

  getS3BucketName(url: string): string {
    const loc = url.indexOf('?');
    return url.substring(0, loc);
  }

  ngOnInit() {}
}
