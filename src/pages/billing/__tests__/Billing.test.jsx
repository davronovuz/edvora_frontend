import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Billing from '../Billing';

// Mock services
vi.mock('@/services/billing', () => ({
  billingProfilesService: {
    getAll: vi.fn(() => Promise.resolve({ data: { data: [] } })),
    modes: vi.fn(() => Promise.resolve({ data: [
      { value: 'monthly_flat', label: 'Oylik' },
      { value: 'per_lesson', label: 'Har dars' },
    ] })),
    create: vi.fn(() => Promise.resolve({ data: {} })),
    update: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
  billingInvoicesService: {
    getAll: vi.fn(() => Promise.resolve({ data: { data: mockInvoices, meta: { total_pages: 1 } } })),
    getById: vi.fn(() => Promise.resolve({ data: mockInvoiceDetail })),
    generate: vi.fn(() => Promise.resolve({ data: {} })),
    cancel: vi.fn(() => Promise.resolve({ data: {} })),
    summary: vi.fn(() => Promise.resolve({ data: mockSummary })),
  },
  billingLeavesService: {
    getAll: vi.fn(() => Promise.resolve({ data: { data: [], meta: { total_pages: 1 } } })),
    approve: vi.fn(() => Promise.resolve({ data: {} })),
    reject: vi.fn(() => Promise.resolve({ data: {} })),
  },
  billingDiscountsService: {
    getAll: vi.fn(() => Promise.resolve({ data: { data: [] } })),
    create: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Mock groups service
vi.mock('@/services/groups', () => ({
  groupsService: {
    getAll: vi.fn(() => Promise.resolve({ data: { data: [] } })),
    getStudents: vi.fn(() => Promise.resolve({ data: { data: [] } })),
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockInvoices = [
  {
    id: '1', number: 'INV-202604-00001',
    student_name: 'Ali Valiyev', group_name: 'Guruh A',
    period_year: 2026, period_month: 4,
    total_amount: '500000.00', paid_amount: '0.00',
    status: 'unpaid', due_date: '2026-04-10',
  },
  {
    id: '2', number: 'INV-202604-00002',
    student_name: 'Vali Aliyev', group_name: 'Guruh B',
    period_year: 2026, period_month: 4,
    total_amount: '300000.00', paid_amount: '300000.00',
    status: 'paid', due_date: '2026-04-10',
  },
];

const mockInvoiceDetail = {
  id: '1', number: 'INV-202604-00001',
  student_name: 'Ali Valiyev', group_name: 'Guruh A',
  period_year: 2026, period_month: 4,
  base_amount: '500000.00', discount_amount: '0.00',
  leave_credit_amount: '0.00', late_fee_amount: '0.00',
  total_amount: '500000.00', paid_amount: '0.00',
  status: 'unpaid', due_date: '2026-04-10',
  lines: [{ description: 'Asosiy — Oylik to\'lov', amount: '500000.00' }],
};

const mockSummary = {
  total_expected: '800000.00',
  total_collected: '300000.00',
  total_debt: '500000.00',
  overdue_count: 0,
  paid_count: 1,
  total_count: 2,
};

const renderBilling = () => render(
  <MemoryRouter>
    <Billing />
  </MemoryRouter>
);

describe('Billing Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sahifa renderlanadi va sarlavha ko\'rinadi', async () => {
    renderBilling();
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  it('4 ta tab ko\'rinadi', async () => {
    renderBilling();
    expect(screen.getByText('Invoicelar')).toBeInTheDocument();
    expect(screen.getByText('Profillar')).toBeInTheDocument();
    expect(screen.getByText("Ta'tillar")).toBeInTheDocument();
    expect(screen.getByText('Chegirmalar')).toBeInTheDocument();
  });

  it('invoicelar tab default ochiq va invoice ko\'rsatadi', async () => {
    renderBilling();
    await waitFor(() => {
      expect(screen.getByText('INV-202604-00001')).toBeInTheDocument();
      expect(screen.getByText('Ali Valiyev')).toBeInTheDocument();
    });
  });

  it('summary kartalar ko\'rinadi', async () => {
    renderBilling();
    await waitFor(() => {
      expect(screen.getByText('Kutilayotgan')).toBeInTheDocument();
      expect(screen.getByText("Yig'ilgan")).toBeInTheDocument();
      expect(screen.getByText('Qarz')).toBeInTheDocument();
    });
  });

  it('profillar tabiga o\'tish ishlaydi', async () => {
    renderBilling();
    fireEvent.click(screen.getByText('Profillar'));
    await waitFor(() => {
      expect(screen.getByText('Yangi profil')).toBeInTheDocument();
    });
  });

  it("ta'tillar tabiga o'tish ishlaydi", async () => {
    renderBilling();
    fireEvent.click(screen.getByText("Ta'tillar"));
    await waitFor(() => {
      expect(screen.getByText("Ta'til topilmadi")).toBeInTheDocument();
    });
  });

  it('chegirmalar tabiga o\'tish ishlaydi', async () => {
    renderBilling();
    fireEvent.click(screen.getByText('Chegirmalar'));
    await waitFor(() => {
      expect(screen.getByText('Yangi chegirma')).toBeInTheDocument();
    });
  });

  it('invoice status badge to\'g\'ri ko\'rsatiladi', async () => {
    renderBilling();
    await waitFor(() => {
      expect(screen.getByText("To'lanmagan")).toBeInTheDocument();
      // "To'langan" matn bir nechta joyda bo'lishi mumkin
      const paidBadges = screen.getAllByText("To'langan");
      expect(paidBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('"Yaratish" tugmasi modal ochadi', async () => {
    renderBilling();
    await waitFor(() => screen.getByText('INV-202604-00001'));
    fireEvent.click(screen.getByText('Yaratish'));
    const matches = screen.getAllByText('Invoice yaratish');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('status filter mavjud', async () => {
    renderBilling();
    const select = screen.getByDisplayValue('Barchasi');
    expect(select).toBeInTheDocument();
  });
});
