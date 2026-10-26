import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrentUser } from '../../../../core/session/current-user';
import { UserRole } from '../../../../core/session/user-role';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { LoadState } from '../../../../shared/models/load-state';
import { ProblemDetail } from '../../../../shared/models/problem-detail';
import { ArsPipe } from '../../../../shared/pipes/ars.pipe';
import { TradeinService } from '../../data-access/tradein.service';
import { ApprovalResponse, ChecklistRequest, DeviceRequest, VoucherResponse } from '../../models/tradein.models';

@Component({
  selector: 'app-tradein-page', standalone: true,
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, ArsPipe, ErrorAlert, LoadingState],
  templateUrl: './tradein-page.html', styleUrl: './tradein-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TradeinPage {
  private readonly builder = inject(FormBuilder).nonNullable;
  private readonly service = inject(TradeinService);
  readonly currentUser = inject(CurrentUser);
  readonly UserRole = UserRole;
  readonly voucherState = signal<LoadState<VoucherResponse>>({ status: 'empty' });
  readonly approvalState = signal<LoadState<ApprovalResponse>>({ status: 'empty' });
  readonly busy = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly imeiVerified = signal(false);
  readonly savedVerification = signal(false);
  readonly now = signal(Date.now());
  readonly voucherCode = this.builder.control('CANJE-2026-001', { validators: [Validators.required] });
  readonly approvalCode = this.builder.control('CANJE-2026-001', { validators: [Validators.required] });
  readonly quoteForm = this.builder.group({
    brand: ['Samsung', Validators.required], model: ['Galaxy S22', Validators.required], memoryGb: [128, [Validators.required, Validators.min(1)]],
    powersOn: [true], screenIntact: [true], batteryPercent: [85, [Validators.required, Validators.min(0), Validators.max(100)]],
    accountUnlocked: [true], boxAndCharger: [true]
  });
  readonly verificationForm = this.builder.group({
    brand: ['', Validators.required], model: ['', Validators.required], memoryGb: [128, [Validators.required, Validators.min(1)]],
    powersOn: [true], screenIntact: [true], batteryPercent: [85, [Validators.required, Validators.min(0), Validators.max(100)]],
    accountUnlocked: [true], boxAndCharger: [true]
  });
  readonly saleForm = this.builder.group({
    imei: ['', [Validators.required, Validators.pattern(/^\d{15}$/)]],
    proposedValue: [0, [Validators.required, Validators.min(0.01)]], reason: ['']
  });
  readonly deviation = computed(() => {
    const voucher = this.voucherState();
    const estimate = voucher.status === 'ready' ? voucher.data.estimate : 0;
    return estimate > 0 ? (this.saleFormValue().proposedValue - estimate) / estimate * 100 : 0;
  });
  readonly absoluteDeviation = computed(() => Math.abs(this.deviation()));
  private readonly saleFormValue = signal({ imei: '', proposedValue: 0, reason: '' });
  readonly canConfirm = computed(() => {
    const voucher = this.voucherState();
    const approval = this.approvalState();
    const sale = this.saleFormValue();
    if (voucher.status !== 'ready' || voucher.data.status !== 'AVAILABLE' || Date.parse(voucher.data.expiresAt) <= this.now() || !this.imeiVerified() || this.busy() || this.saleForm.invalid || !this.savedVerification()) return false;
    if (Math.abs(this.deviation()) <= 10) return true;
    return approval.status === 'ready' && approval.data.status === 'APPROVED' && approval.data.code === voucher.data.code && approval.data.imei === sale.imei && approval.data.proposed === sale.proposedValue && approval.data.estimate === voucher.data.estimate;
  });

  constructor() {
    this.verificationForm.valueChanges.subscribe(() => this.invalidateVerification());
    this.saleForm.valueChanges.subscribe(() => {
      this.saleFormValue.set(this.saleForm.getRawValue());
      this.imeiVerified.set(false);
      this.approvalState.set({ status: 'empty' });
    });
  }

  get isSeller(): boolean { return this.currentUser.user().role === UserRole.VENDEDOR; }
  get isSupervisor(): boolean { return this.currentUser.user().role === UserRole.SUPERVISOR; }

  quote(): void {
    if (this.quoteForm.invalid) { this.quoteForm.markAllAsTouched(); this.error.set('Seleccioná un equipo válido'); return; }
    const values = this.quoteForm.getRawValue();
    this.start();
    this.service.createQuote({ branch: 'CENTRO', device: this.device(values), checklist: this.checklist(values) }).subscribe({
      next: voucher => { this.busy.set(false); this.voucherState.set({ status: 'ready', data: voucher }); this.voucherCode.setValue(voucher.code); this.message.set('Cotización estimada y vale generados'); },
      error: (cause: unknown) => this.fail(cause)
    });
  }

  loadVoucher(): void {
    const code = this.voucherCode.value.trim();
    if (!code) { this.error.set('Ingresá el código del vale'); return; }
    this.start();
    this.savedVerification.set(false);
    this.imeiVerified.set(false);
    this.approvalState.set({ status: 'empty' });
    this.voucherState.set({ status: 'loading' });
    this.service.getVoucher(code).subscribe({
      next: voucher => {
        this.busy.set(false);
        this.now.set(Date.now());
        this.voucherState.set({ status: 'ready', data: voucher });
        const device = voucher.verifiedDevice ?? voucher.declaredDevice;
        const checklist = voucher.verifiedChecklist ?? voucher.declaredChecklist;
        this.verificationForm.setValue({ ...device, ...checklist }, { emitEvent: false });
        this.saleForm.patchValue({ proposedValue: voucher.estimate }, { emitEvent: false });
        this.saleFormValue.set(this.saleForm.getRawValue());
        this.savedVerification.set(true);
        if (voucher.status !== 'AVAILABLE') this.error.set('Este vale ya no puede utilizarse');
        else if (Date.parse(voucher.expiresAt) <= this.now()) this.error.set('El vale está vencido');
      },
      error: (cause: unknown) => { this.fail(cause); this.voucherState.set({ status: 'error', message: this.error() }); }
    });
  }

  updateQuote(): void {
    const voucher = this.voucherState();
    if (voucher.status !== 'ready' || !this.isAvailable(voucher.data)) return;
    if (this.verificationForm.invalid) { this.verificationForm.markAllAsTouched(); this.error.set('Seleccioná un equipo válido'); return; }
    const values = this.verificationForm.getRawValue();
    if (!values.screenIntact) { this.error.set('Canje rechazado: pantalla rota'); return; }
    if (!values.accountUnlocked) { this.error.set('Canje rechazado: bloqueo de cuenta'); return; }
    this.start();
    this.service.updateVerifiedQuote(voucher.data.code, { device: this.device(values), checklist: this.checklist(values) }).subscribe({
      next: updated => {
        this.busy.set(false); this.voucherState.set({ status: 'ready', data: updated });
        this.savedVerification.set(true); this.approvalState.set({ status: 'empty' });
        this.saleForm.patchValue({ proposedValue: updated.estimate });
        this.message.set('Cotización actualizada; aprobaciones anteriores sin efecto');
      },
      error: () => { this.busy.set(false); this.error.set('No se pudo actualizar la cotización. Intentá nuevamente'); }
    });
  }

  verifyImei(): void {
    const imei = this.saleForm.controls.imei.value;
    if (!/^\d{15}$/.test(imei)) { this.error.set('Ingresá un IMEI válido'); return; }
    this.start(); this.imeiVerified.set(false);
    this.service.checkImeiReport(imei).subscribe({
      next: report => {
        this.busy.set(false);
        if (report.status === 'CLEAR') { this.imeiVerified.set(true); this.message.set('Sin denuncia · verificado'); }
        else if (report.status === 'REPORTED') this.error.set('Canje rechazado: equipo denunciado');
        else if (report.status === 'INVALID') this.error.set('Ingresá un IMEI válido');
        else this.error.set('No se pudo verificar el IMEI. Intentá nuevamente');
      },
      error: () => { this.busy.set(false); this.error.set('No se pudo verificar el IMEI. Intentá nuevamente'); }
    });
  }

  requestApproval(): void {
    const voucher = this.voucherState();
    if (voucher.status !== 'ready' || !this.isAvailable(voucher.data) || !this.savedVerification() || !this.imeiVerified()) return;
    if (this.saleForm.controls.proposedValue.invalid) { this.error.set('Ingresá un valor propuesto mayor que cero'); return; }
    if (this.saleForm.invalid || !this.saleForm.controls.reason.value.trim()) { this.error.set('Ingresá el motivo del ajuste'); return; }
    this.start(); this.approvalState.set({ status: 'loading' });
    const { imei, proposedValue, reason } = this.saleForm.getRawValue();
    this.service.requestValueApproval(voucher.data.code, { imei, proposedValue, reason }).subscribe({
      next: approval => { this.busy.set(false); this.approvalState.set({ status: 'ready', data: approval }); this.message.set('Solicitud enviada al supervisor'); },
      error: () => { this.busy.set(false); this.approvalState.set({ status: 'error', message: 'No se pudo gestionar la aprobación. Intentá nuevamente' }); this.error.set('No se pudo gestionar la aprobación. Intentá nuevamente'); }
    });
  }

  checkApproval(): void {
    const voucher = this.voucherState();
    if (voucher.status !== 'ready') return;
    this.start(); this.approvalState.set({ status: 'loading' });
    this.service.getValueApproval(voucher.data.code).subscribe({
      next: approval => {
        this.busy.set(false); this.approvalState.set({ status: 'ready', data: approval });
        if (approval.status === 'REJECTED') this.error.set('El supervisor rechazó el valor propuesto');
      },
      error: () => { this.busy.set(false); this.approvalState.set({ status: 'error', message: 'No se pudo gestionar la aprobación. Intentá nuevamente' }); this.error.set('No se pudo gestionar la aprobación. Intentá nuevamente'); }
    });
  }

  loadSupervisorApproval(): void {
    if (!this.approvalCode.value.trim()) { this.error.set('Ingresá el código del vale'); return; }
    this.start(); this.approvalState.set({ status: 'loading' });
    this.service.getValueApproval(this.approvalCode.value.trim()).subscribe({
      next: approval => { this.busy.set(false); this.approvalState.set({ status: 'ready', data: approval }); },
      error: (cause: unknown) => { this.fail(cause); this.approvalState.set({ status: 'error', message: this.error() }); }
    });
  }

  resolve(approved: boolean): void {
    const state = this.approvalState();
    if (state.status !== 'ready' || state.data.status !== 'PENDING' || !this.isSupervisor) return;
    this.start();
    this.service.resolveValueApproval(state.data.id, { approved }).subscribe({
      next: approval => { this.busy.set(false); this.approvalState.set({ status: 'ready', data: approval }); this.message.set(approved ? 'Valor aprobado' : 'Valor rechazado'); },
      error: () => { this.busy.set(false); this.error.set('No se pudo gestionar la aprobación. Intentá nuevamente'); }
    });
  }

  confirm(): void {
    const voucher = this.voucherState();
    if (!this.canConfirm() || voucher.status !== 'ready') return;
    const { imei, proposedValue } = this.saleForm.getRawValue();
    this.start();
    this.service.confirmFinalValue(voucher.data.code, { imei, proposedValue }).subscribe({
      next: updated => { this.busy.set(false); this.voucherState.set({ status: 'ready', data: updated }); this.message.set('Valor final confirmado'); },
      error: (cause: unknown) => {
        this.busy.set(false);
        const detail = this.detail(cause);
        this.error.set(detail && detail !== 'Error de conexión' ? detail : 'No se pudo confirmar el valor final. Intentá nuevamente');
      }
    });
  }

  isAvailable(voucher: VoucherResponse): boolean {
    return voucher.status === 'AVAILABLE' && Date.parse(voucher.expiresAt) > this.now();
  }

  differences(voucher: VoucherResponse): string[] {
    const original = voucher.declaredChecklist;
    const checked = voucher.verifiedChecklist;
    if (!checked) return [];
    const result: string[] = [];
    if (original.batteryPercent !== checked.batteryPercent) result.push(`Batería: declarada ${original.batteryPercent} %, verificada ${checked.batteryPercent} %`);
    if (original.screenIntact !== checked.screenIntact) result.push('El estado de la pantalla cambió');
    if (original.accountUnlocked !== checked.accountUnlocked) result.push('El bloqueo de cuenta cambió');
    if (original.powersOn !== checked.powersOn) result.push('El estado de encendido cambió');
    if (original.boxAndCharger !== checked.boxAndCharger) result.push('La disponibilidad de caja y cargador cambió');
    return result;
  }

  private invalidateVerification(): void {
    this.savedVerification.set(false);
    this.imeiVerified.set(false);
    this.approvalState.set({ status: 'empty' });
  }

  private device(values: { brand: string; model: string; memoryGb: number }): DeviceRequest {
    return { brand: values.brand.trim(), model: values.model.trim(), memoryGb: values.memoryGb };
  }

  private checklist(values: ChecklistRequest): ChecklistRequest {
    return { powersOn: values.powersOn, screenIntact: values.screenIntact, batteryPercent: values.batteryPercent, accountUnlocked: values.accountUnlocked, boxAndCharger: values.boxAndCharger };
  }

  private start(): void { this.busy.set(true); this.error.set(''); this.message.set(''); this.now.set(Date.now()); }
  private fail(cause: unknown): void { this.busy.set(false); this.error.set(this.detail(cause)); }
  private detail(cause: unknown): string {
    if (cause instanceof HttpErrorResponse) {
      const problem: unknown = cause.error;
      if (typeof problem === 'object' && problem !== null && 'detail' in problem && typeof (problem as ProblemDetail).detail === 'string') return (problem as ProblemDetail).detail;
    }
    return 'Error de conexión';
  }
}
