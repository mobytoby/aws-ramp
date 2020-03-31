import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { APIService } from 'src/app/api.service';

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
      <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss('Cross click')">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <div class="row">
        <div class="col-sm-6">
          <img src="{{selectedImageSrc}}" class="img-fluid" alt="Responsive image">
        </div>
        <div class="col-sm-6">
          <form>
            <div class="form-group">
              <div *ngFor="let filterType of filters" class="col">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" value="" [id]="filterType.id" [disabled]="filterType.disabled">
                  <label class="form-check-label" [for]="filterType.id">
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
      <button ngbAutofocus type="button" class="btn btn-outline-dark" (click)="onApply()">Apply Filter</button>
    </div>
  `,
  styles: []
})
export class ModalFilterSelectionComponent implements OnInit {
  @Input() selectedImageSrc: string;
  filters: FilterType[] = [
    {id: 'greyscale', name: 'Greyscale', disabled: false},
    {id: 'cartoon', name: 'Cartoon', disabled: true},
    {id: 'saturate', name: 'Saturate', disabled: true},
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private apiSvc: APIService
    ) { }

  onApply() {
  }

  ngOnInit() {
  }

}