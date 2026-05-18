import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { paymentsService } from '@/services/payments';
import { billingInvoicesService } from '@/services/billing';
import { unwrap, unwrapList } from '@/services/api';
import { notify } from '@/lib/notify';
import { studentKeys } from './useStudents';
import { billingKeys } from './useBilling';

export const paymentKeys = {
  all: ['payments'],
  lists: () => [...paymentKeys.all, 'list'],
  list: (params) => [...paymentKeys.lists(), params],
  details: () => [...paymentKeys.all, 'detail'],
  detail: (id) => [...paymentKeys.details(), id],
  statistics: (params) => [...paymentKeys.all, 'statistics', params],
  byStudent: (studentId) => [...paymentKeys.all, 'by-student', studentId],
};

export const debtorKeys = {
  all: ['debtors'],
  list: (params) => [...debtorKeys.all, 'list', params],
};

// To'lov o'zgarganda butun Moliya bo'limini sinxron yangilash —
// to'lovlar, hisob-fakturalar, qarzdorlar, kassa, o'quvchi balansi.
function invalidateFinance(qc) {
  qc.invalidateQueries({ queryKey: paymentKeys.all });
  qc.invalidateQueries({ queryKey: billingKeys.all });
  qc.invalidateQueries({ queryKey: debtorKeys.all });
  qc.invalidateQueries({ queryKey: studentKeys.all });
  qc.invalidateQueries({ queryKey: ['finance'] });
}

export function usePaymentsList(params = {}) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: async () => {
      const res = await paymentsService.getAll(params);
      const body = unwrap(res);
      const list = Array.isArray(body) ? body : (body?.results ?? body?.data ?? []);
      const meta = body?.meta || (body?.count !== undefined
        ? { total: body.count, total_pages: Math.ceil(body.count / (params.per_page || 20)), per_page: params.per_page || 20 }
        : { total: list.length, total_pages: 1, per_page: list.length });
      return { items: Array.isArray(list) ? list : [], meta };
    },
    placeholderData: keepPreviousData,
  });
}

export function usePayment(id) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: async () => unwrap(await paymentsService.getById(id)),
    enabled: !!id,
  });
}

export function usePaymentStatistics(params = {}) {
  return useQuery({
    queryKey: paymentKeys.statistics(params),
    queryFn: async () => unwrap(await paymentsService.statistics(params)),
  });
}

export function usePaymentsByStudent(studentId) {
  return useQuery({
    queryKey: paymentKeys.byStudent(studentId),
    queryFn: async () => unwrapList(await paymentsService.byStudent(studentId)),
    enabled: !!studentId,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => paymentsService.create(data),
    onSuccess: () => {
      invalidateFinance(qc);
      notify.success("To'lov qabul qilindi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => paymentsService.update(id, data),
    onSuccess: (_, { id }) => {
      invalidateFinance(qc);
      qc.invalidateQueries({ queryKey: paymentKeys.detail(id) });
      notify.success("To'lov yangilandi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => paymentsService.delete(id),
    onSuccess: () => {
      invalidateFinance(qc);
      notify.success("To'lov o'chirildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useRefundPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => paymentsService.refund(id),
    onSuccess: () => {
      invalidateFinance(qc);
      notify.success("To'lov qaytarildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useDebtorsList(params = {}) {
  return useQuery({
    queryKey: debtorKeys.list(params),
    queryFn: async () => {
      const raw = unwrapList(await billingInvoicesService.debtors(params));
      return raw.map(d => ({
        student_id: d.student__id ?? d.student_id ?? d.id,
        student_name: d.student__first_name
          ? `${d.student__first_name} ${d.student__last_name || ''}`.trim()
          : (d.student_name || '—'),
        student_phone: d.student_phone || null,
        parent_phone: d.parent_phone || null,
        groups: d.groups || [],
        total_debt: Number(d.total_debt ?? 0),
        invoice_count: d.invoice_count || 0,
        earliest_due_date: d.earliest_due_date || null,
        overdue_count: d.overdue_count || 0,
      }));
    },
  });
}
