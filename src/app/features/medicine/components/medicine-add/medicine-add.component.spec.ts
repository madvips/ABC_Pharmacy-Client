import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicineAddComponent } from './medicine-add.component';

describe('MedicineAddComponent', () => {
  let component: MedicineAddComponent;
  let fixture: ComponentFixture<MedicineAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MedicineAddComponent]
    });
    fixture = TestBed.createComponent(MedicineAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
