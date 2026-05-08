import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MedicineListComponent } from './features/medicine/components/medicine-list/medicine-list.component';
import { MedicineAddComponent } from './features/medicine/components/medicine-add/medicine-add.component';
import { SaleListComponent } from './features/sale/components/sale-list/sale-list.component';
import { SaleAddComponent } from './features/sale/components/sale-add/sale-add.component';

const routes: Routes = [
  {path: '', redirectTo: '/sales', pathMatch: 'full'},
  {path: 'medicines', component: MedicineListComponent, data: { title: 'Medicine List' } },
  {path: 'medicines/add', component: MedicineAddComponent, data: { title: 'Add Medicine' } },
  {path: 'sales', component: SaleListComponent, data: { title: 'Sales Records' } },
  {path: 'sales/add', component: SaleAddComponent, data: { title: 'Record Sale' } },
  {path: '**', redirectTo: '/sales' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
