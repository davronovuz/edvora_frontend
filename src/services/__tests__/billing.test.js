import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  billingProfilesService,
  billingInvoicesService,
  billingLeavesService,
  billingDiscountsService,
} from '../billing';

// Mock api module
vi.mock('../api', () => {
  const mockApi = {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  };
  return { default: mockApi };
});

import api from '../api';

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================
// Billing Profiles Service
// ============================================
describe('billingProfilesService', () => {
  it('getAll — GET /billing/profiles/', async () => {
    await billingProfilesService.getAll({ page: 1 });
    expect(api.get).toHaveBeenCalledWith('/billing/profiles/', { params: { page: 1 } });
  });

  it('getById — GET /billing/profiles/:id/', async () => {
    await billingProfilesService.getById('abc');
    expect(api.get).toHaveBeenCalledWith('/billing/profiles/abc/');
  });

  it('create — POST /billing/profiles/', async () => {
    const data = { name: 'Test', mode: 'monthly_flat' };
    await billingProfilesService.create(data);
    expect(api.post).toHaveBeenCalledWith('/billing/profiles/', data);
  });

  it('update — PATCH /billing/profiles/:id/', async () => {
    await billingProfilesService.update('abc', { name: 'Updated' });
    expect(api.patch).toHaveBeenCalledWith('/billing/profiles/abc/', { name: 'Updated' });
  });

  it('delete — DELETE /billing/profiles/:id/', async () => {
    await billingProfilesService.delete('abc');
    expect(api.delete).toHaveBeenCalledWith('/billing/profiles/abc/');
  });

  it('modes — GET /billing/profiles/modes/', async () => {
    await billingProfilesService.modes();
    expect(api.get).toHaveBeenCalledWith('/billing/profiles/modes/');
  });
});

// ============================================
// Billing Invoices Service
// ============================================
describe('billingInvoicesService', () => {
  it('getAll with params', async () => {
    await billingInvoicesService.getAll({ status: 'unpaid', page: 2 });
    expect(api.get).toHaveBeenCalledWith('/billing/invoices/', { params: { status: 'unpaid', page: 2 } });
  });

  it('generate — POST', async () => {
    const data = { group_student_id: 'uuid', year: 2026, month: 4 };
    await billingInvoicesService.generate(data);
    expect(api.post).toHaveBeenCalledWith('/billing/invoices/generate/', data);
  });

  it('generateGroup — POST', async () => {
    const data = { group_id: 'uuid', year: 2026, month: 4 };
    await billingInvoicesService.generateGroup(data);
    expect(api.post).toHaveBeenCalledWith('/billing/invoices/generate-group/', data);
  });

  it('cancel — POST', async () => {
    await billingInvoicesService.cancel('inv-id');
    expect(api.post).toHaveBeenCalledWith('/billing/invoices/inv-id/cancel/');
  });

  it('allocatePayment — POST', async () => {
    const data = { payment_id: 'p1', group_student_id: 'gs1' };
    await billingInvoicesService.allocatePayment(data);
    expect(api.post).toHaveBeenCalledWith('/billing/invoices/allocate-payment/', data);
  });

  it('debtors — GET', async () => {
    await billingInvoicesService.debtors();
    expect(api.get).toHaveBeenCalledWith('/billing/invoices/debtors/', { params: {} });
  });

  it('summary — GET with params', async () => {
    await billingInvoicesService.summary({ year: 2026, month: 4 });
    expect(api.get).toHaveBeenCalledWith('/billing/invoices/summary/', { params: { year: 2026, month: 4 } });
  });
});

// ============================================
// Billing Leaves Service
// ============================================
describe('billingLeavesService', () => {
  it('getAll', async () => {
    await billingLeavesService.getAll({ status: 'pending' });
    expect(api.get).toHaveBeenCalledWith('/billing/leaves/', { params: { status: 'pending' } });
  });

  it('create', async () => {
    const data = { group_student: 'gs1', start_date: '2026-04-10', end_date: '2026-04-14', reason: 'Trip' };
    await billingLeavesService.create(data);
    expect(api.post).toHaveBeenCalledWith('/billing/leaves/', data);
  });

  it('approve', async () => {
    await billingLeavesService.approve('leave-id');
    expect(api.post).toHaveBeenCalledWith('/billing/leaves/leave-id/approve/');
  });

  it('reject', async () => {
    await billingLeavesService.reject('leave-id');
    expect(api.post).toHaveBeenCalledWith('/billing/leaves/leave-id/reject/');
  });
});

// ============================================
// Billing Discounts Service
// ============================================
describe('billingDiscountsService', () => {
  it('getAll', async () => {
    await billingDiscountsService.getAll();
    expect(api.get).toHaveBeenCalledWith('/billing/discounts/', { params: {} });
  });

  it('create', async () => {
    const data = { name: 'Sale', kind: 'student_percent', value_type: 'percent', value: '10', start_date: '2026-01-01' };
    await billingDiscountsService.create(data);
    expect(api.post).toHaveBeenCalledWith('/billing/discounts/', data);
  });

  it('delete', async () => {
    await billingDiscountsService.delete('d-id');
    expect(api.delete).toHaveBeenCalledWith('/billing/discounts/d-id/');
  });
});
