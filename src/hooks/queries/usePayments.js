import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { paymentsService } from '@/services/payments';
import { unwrap, unwrapList } from '@/services/api';
import { notify } from '@/lib/notify';
import { studentKeys } from './useStudents';

export const paymentKeys = {
  all: ['payments'],
  lists: () => [...paymentKeys.all, 'list'],
  list: (params) => [...paymentKeys.lists(), params],
  details: () => [...paymentKeys.all, 'detail'],
  detail: (id) => [...paymentKeys.details(), id],
  statistics: (params) => [...paymentKeys.all, 'statistics', params],
  byStudent: (studentId) => [...paymentKeys.all, 'by-student', studentId],
};

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
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: studentKeys.all });
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
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: paymentKeys.detail(id) });
      qc.invalidateQueries({ queryKey: studentKeys.all });
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
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: studentKeys.all });
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
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: studentKeys.all });
      notify.success("To'lov qaytarildi");
    },
    onError: (e) => notify.error(e),
  });
}
