import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { CheckoutService } from '../../data-access/checkout.service';
import { CartResponse, DeliveryOptionsResponse, OnlineOrderResponse, PlaceOrderRequest, ReservationResponse } from '../../models/checkout.models';
import { LoadState } from '../../../../shared/models/load-state';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { ArsPipe } from '../../../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ErrorAlert, LoadingState, ArsPipe],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutPage implements OnDestroy {
  private readonly checkout = inject(CheckoutService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly subscriptions = new Subscription();
  readonly cartState = signal<LoadState<CartResponse>>({ status: 'loading' });
  readonly deliveryState = signal<LoadState<DeliveryOptionsResponse>>({ status: 'loading' });
  readonly reservationState = signal<LoadState<ReservationResponse>>({ status: 'empty' });
  readonly orderState = signal<LoadState<OnlineOrderResponse>>({ status: 'empty' });
  readonly step = signal<'cart' | 'details' | 'delivery' | 'payment' | 'done'>('cart');
  readonly now = signal(Date.now());
  readonly secondsLeft = computed(() => {
    const reservation = this.reservationState();
    return reservation.status === 'ready' ? Math.max(0, Math.ceil((Date.parse(reservation.data.expiresAt) - this.now()) / 1000)) : 0;
  });
  readonly selectedAccessories = signal<string[]>([]);
  readonly cartForm = this.fb.group({ voucherCode: [''] });
  readonly checkoutForm = this.fb.group({
    fullName: ['', Validators.required],
    dni: ['', [Validators.required, Validators.pattern(/^[0-9]{7,8}$/)]],
    email: ['', [Validators.required, Validators.email]],
    invoiceType: ['B', Validators.required],
    cuit: [''],
    deliveryMethod: ['RETIRO', Validators.required],
    branch: ['', Validators.required],
    address: [''],
    postalCode: [''],
    paymentMethod: ['TRANSFERENCIA', Validators.required],
    paymentToken: [''],
    installments: [1, [Validators.required, Validators.min(1)]]
  });
  readonly formError = signal<string | null>(null);

  constructor() {
    this.loadCart();
    this.loadDelivery();
    this.subscriptions.add(interval(1000).subscribe(() => {
      this.now.set(Date.now());
      const reservation = this.reservationState();
      if (reservation.status === 'ready' && this.secondsLeft() === 0 && this.step() !== 'done') {
        this.reservationState.set({ status: 'empty' });
        this.formError.set('La reserva venció. Volvé a verificar el stock antes de pagar.');
        this.step.set('delivery');
        this.loadCart();
        this.loadDelivery();
      }
    }));
  }

  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body: unknown = error.error;
      if (typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string') return body.detail;
    }
    return 'No se pudo completar la operación. Intentá nuevamente.';
  }

  loadCart(): void {
    this.cartState.set({ status: 'loading' });
    this.subscriptions.add(this.checkout.getCart().subscribe({
      next: cart => {
        this.selectedAccessories.set(cart.accessories.map(item => item.id));
        this.cartForm.controls.voucherCode.setValue(cart.voucherCode ?? '');
        this.cartState.set(cart.variantId ? { status: 'ready', data: cart } : { status: 'empty' });
      },
      error: (error: unknown) => this.cartState.set({ status: 'error', message: this.errorMessage(error) })
    }));
  }

  loadDelivery(): void {
    this.deliveryState.set({ status: 'loading' });
    const postalCode = this.checkoutForm.controls.postalCode.value.trim();
    this.subscriptions.add(this.checkout.getDeliveryOptions(postalCode || null).subscribe({
      next: options => {
        this.deliveryState.set(options.pickupBranches.length || options.shipping.available ? { status: 'ready', data: options } : { status: 'empty' });
        if (!this.checkoutForm.controls.branch.value && options.pickupBranches.length) {
          this.checkoutForm.controls.branch.setValue(options.pickupBranches[0].branch);
        }
      },
      error: (error: unknown) => this.deliveryState.set({ status: 'error', message: this.errorMessage(error) })
    }));
  }

  toggleAccessory(id: string, checked: boolean): void {
    this.selectedAccessories.update(ids => checked ? [...ids, id] : ids.filter(item => item !== id));
  }

  saveCart(): void {
    const state = this.cartState();
    if (state.status !== 'ready') return;
    this.formError.set(null);
    this.cartState.set({ status: 'loading' });
    this.subscriptions.add(this.checkout.updateCart({
      variantId: state.data.variantId,
      accessoryIds: this.selectedAccessories(),
      voucherCode: this.cartForm.controls.voucherCode.value.trim() || null
    }).subscribe({
      next: cart => { this.cartState.set({ status: 'ready', data: cart }); this.step.set('details'); },
      error: (error: unknown) => { this.cartState.set({ status: 'ready', data: state.data }); this.formError.set(this.errorMessage(error)); }
    }));
  }

  continueToDelivery(): void {
    const controls = this.checkoutForm.controls;
    for (const key of ['fullName', 'dni', 'email'] as const) controls[key].markAsTouched();
    if (controls.fullName.invalid || controls.dni.invalid || controls.email.invalid || (controls.invoiceType.value === 'A' && !controls.cuit.value.trim())) {
      this.formError.set('Completá nombre, DNI, correo y CUIT si solicitás factura A.');
      return;
    }
    this.formError.set(null);
    this.step.set('delivery');
  }

  reserve(): void {
    const cart = this.cartState();
    const delivery = this.deliveryState();
    if (cart.status !== 'ready' || delivery.status !== 'ready') return;
    const values = this.checkoutForm.getRawValue();
    if (values.deliveryMethod === 'ENVIO' && (!values.address.trim() || !values.postalCode.trim() || !delivery.data.shipping.available)) {
      this.formError.set('Ingresá una dirección y un código postal con envío disponible.');
      return;
    }
    if (!values.branch || !delivery.data.pickupBranches.some(item => item.branch === values.branch)) {
      this.formError.set('Seleccioná una sucursal con stock disponible.');
      return;
    }
    this.formError.set(null);
    this.reservationState.set({ status: 'loading' });
    this.subscriptions.add(this.checkout.reserveUnit({ variantId: cart.data.variantId, branch: values.branch }).subscribe({
      next: reservation => { this.reservationState.set({ status: 'ready', data: reservation }); this.step.set('payment'); },
      error: (error: unknown) => this.reservationState.set({ status: 'error', message: this.errorMessage(error) })
    }));
  }

  placeOrder(): void {
    const reservation = this.reservationState();
    if (reservation.status !== 'ready' || this.secondsLeft() === 0) {
      this.formError.set('La reserva venció. Volvé a verificar el stock.');
      this.step.set('delivery');
      return;
    }
    const values = this.checkoutForm.getRawValue();
    if (values.paymentMethod === 'TARJETA' && !values.paymentToken.trim()) {
      this.formError.set('Ingresá el token proporcionado por la pasarela de pagos. Nunca ingreses los datos de tu tarjeta aquí.');
      return;
    }
    this.formError.set(null);
    const request: PlaceOrderRequest = {
      reservationId: reservation.data.id, fullName: values.fullName.trim(), dni: values.dni.trim(), email: values.email.trim(),
      invoiceType: values.invoiceType, cuit: values.invoiceType === 'A' ? values.cuit.trim() : null,
      deliveryMethod: values.deliveryMethod, address: values.deliveryMethod === 'ENVIO' ? values.address.trim() : null,
      postalCode: values.deliveryMethod === 'ENVIO' ? values.postalCode.trim() : null,
      paymentMethod: values.paymentMethod, paymentToken: values.paymentMethod === 'TARJETA' ? values.paymentToken.trim() : null,
      installments: values.paymentMethod === 'TARJETA' ? values.installments : 1
    };
    this.orderState.set({ status: 'loading' });
    this.subscriptions.add(this.checkout.placeOnlineOrder(request).subscribe({
      next: order => { this.orderState.set({ status: 'ready', data: order }); this.step.set('done'); },
      error: (error: unknown) => this.orderState.set({ status: 'error', message: this.errorMessage(error) })
    }));
  }
}
