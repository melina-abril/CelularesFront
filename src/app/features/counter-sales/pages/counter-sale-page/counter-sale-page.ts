import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CounterSalesService } from '../../data-access/counter-sales.service';
import { ApprovalResponse, CustomerResponse, ImeiResponse, PaymentMethod, SaleResponse } from '../../models/counter-sales.models';
import { CurrentUser } from '../../../../core/session/current-user';
import { UserRole } from '../../../../core/session/user-role';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { LoadState } from '../../../../shared/models/load-state';
import { ArsPipe } from '../../../../shared/pipes/ars.pipe';

function errorDetail(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body: unknown = error.error;
    if (typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string') {
      return body.detail;
    }
  }
  return 'No se pudo completar la operación. Intentá nuevamente.';
}

@Component({
  selector: 'app-counter-sale-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, ArsPipe, ErrorAlert, LoadingState],
  templateUrl: './counter-sale-page.html',
  styleUrl: './counter-sale-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CounterSalePage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly service = inject(CounterSalesService);
  readonly session = inject(CurrentUser);
  readonly UserRole = UserRole;

  readonly lookupForm = this.fb.group({ dni: ['', [Validators.required, Validators.pattern(/^[0-9]{7,8}$/)]] });
  readonly customerForm = this.fb.group({
    dni: ['', [Validators.required, Validators.pattern(/^[0-9]{7,8}$/)]],
    name: ['', Validators.required], phone: ['', Validators.required],
    registeredTaxpayer: [false], cuit: ['']
  });
  readonly imeiForm = this.fb.group({ imei: ['', Validators.required] });
  readonly saleForm = this.fb.group({
    accessorySkus: [''], voucherCode: [''], discountPercent: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    approvalId: [''], paymentMethod: ['CASH' as PaymentMethod, Validators.required],
    installments: [1, Validators.min(1)], bank: [''], paymentTotal: [0, [Validators.required, Validators.min(0.01)]]
  });

  readonly customerState = signal<LoadState<CustomerResponse>>({ status: 'empty' });
  readonly imeiState = signal<LoadState<ImeiResponse>>({ status: 'empty' });
  readonly approvalState = signal<LoadState<ApprovalResponse>>({ status: 'empty' });
  readonly saleState = signal<LoadState<SaleResponse>>({ status: 'empty' });
  readonly customer = computed(() => {
    const state = this.customerState();
    return state.status === 'ready' ? state.data : null;
  });
  readonly unit = computed(() => {
    const state = this.imeiState();
    return state.status === 'ready' ? state.data : null;
  });

  findCustomer(): void {
    if (this.lookupForm.invalid) { this.lookupForm.markAllAsTouched(); return; }
    this.customerState.set({ status: 'loading' });
    this.service.findCustomerByDni(this.lookupForm.getRawValue().dni).subscribe({
      next: data => this.customerState.set({ status: 'ready', data }),
      error: (error: unknown) => this.customerState.set({ status: 'error', message: errorDetail(error) })
    });
  }

  createCustomer(): void {
    if (this.customerForm.invalid) { this.customerForm.markAllAsTouched(); return; }
    const form = this.customerForm.getRawValue();
    if (form.registeredTaxpayer && !form.cuit.trim()) {
      this.customerState.set({ status: 'error', message: 'Ingresá el CUIT para emitir factura A.' });
      return;
    }
    this.customerState.set({ status: 'loading' });
    this.service.createCustomer({ ...form, cuit: form.cuit.trim() || null }).subscribe({
      next: data => this.customerState.set({ status: 'ready', data }),
      error: (error: unknown) => this.customerState.set({ status: 'error', message: errorDetail(error) })
    });
  }

  verifyImei(): void {
    if (this.imeiForm.invalid) { this.imeiForm.markAllAsTouched(); return; }
    this.imeiState.set({ status: 'loading' });
    this.approvalState.set({ status: 'empty' });
    this.service.verifySaleImei(this.imeiForm.getRawValue()).subscribe({
      next: data => {
        this.imeiState.set(data.available ? { status: 'ready', data } : { status: 'error', message: 'La unidad no está disponible.' });
        if (data.available) this.saleForm.controls.paymentTotal.setValue(data.cashPrice);
      },
      error: (error: unknown) => this.imeiState.set({ status: 'error', message: errorDetail(error) })
    });
  }

  requestApproval(): void {
    const unit = this.unit();
    const percent = this.saleForm.controls.discountPercent.value;
    if (!unit || percent <= 5 || percent > 100 || this.session.user().role !== UserRole.VENDEDOR) return;
    this.approvalState.set({ status: 'loading' });
    this.service.requestDiscountApproval({ imei: unit.imei, percent }).subscribe({
      next: data => {
        this.saleForm.controls.approvalId.setValue(data.id);
        this.approvalState.set({ status: 'ready', data });
      },
      error: (error: unknown) => this.approvalState.set({ status: 'error', message: errorDetail(error) })
    });
  }

  createSale(): void {
    const customer = this.customer();
    const unit = this.unit();
    if (this.saleForm.invalid || !customer || !unit) { this.saleForm.markAllAsTouched(); return; }
    const form = this.saleForm.getRawValue();
    this.saleState.set({ status: 'loading' });
    this.service.createCounterSale({
      dni: customer.dni, imei: unit.imei,
      accessorySkus: form.accessorySkus.split(',').map(sku => sku.trim()).filter(sku => sku.length > 0),
      discountPercent: form.discountPercent, approvalId: form.approvalId.trim() || null,
      voucherCode: form.voucherCode.trim() || null, paymentMethod: form.paymentMethod,
      installments: form.paymentMethod === 'CREDIT' ? form.installments : null,
      bank: form.paymentMethod === 'CREDIT' ? form.bank.trim() || null : null,
      paymentTotal: form.paymentTotal
    }).subscribe({
      next: data => this.saleState.set({ status: 'ready', data }),
      error: (error: unknown) => this.saleState.set({ status: 'error', message: errorDetail(error) })
    });
  }
}
