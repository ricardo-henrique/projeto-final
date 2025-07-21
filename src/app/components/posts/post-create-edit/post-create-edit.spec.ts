import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostCreateEdit } from './post-create-edit';

describe('PostCreateEdit', () => {
  let component: PostCreateEdit;
  let fixture: ComponentFixture<PostCreateEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostCreateEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostCreateEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
