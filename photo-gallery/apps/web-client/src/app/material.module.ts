import { NgModule } from '@angular/core';
import {
  MdcButtonModule,
  MdcCardModule,
  MdcElevationModule,
  MdcIconModule,
  MdcImageListModule,
  MdcListModule,
  MdcRippleModule,
  MdcTypographyModule
} from '@angular-mdc/web';

@NgModule({
  exports: [
    MdcButtonModule,
    MdcCardModule,
    MdcElevationModule,
    MdcIconModule,
    MdcImageListModule,
    MdcListModule,
    MdcRippleModule,
    MdcTypographyModule
  ]
})
export class MaterialModule { }
