import { NgModule } from '@angular/core';
import {
  MdcButtonModule,
  MdcCardModule,
  MdcElevationModule,
  MdcIconModule,
  MdcImageListModule,
  MdcListModule,
  MdcRippleModule,
  MdcTabBarModule,
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
    MdcTabBarModule,
    MdcTypographyModule,
  ]
})
export class MaterialModule { }
