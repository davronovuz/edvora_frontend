import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  billingInvoicesService,
  billingProfilesService,
  billingLeavesService,
  billingDiscountsService,
} from '@/services/billing';
import { unwrap, unwrapList } from '@/services/api';
import { notify } from '@/lib/notify';

export const billingKeys = {
  all: ['billing'],
  invoices: () => [...billingKeys.all, 'invoices'],
  invoiceList: (params) => [...billingKeys.invoices(), 'list', params],
  invoiceSummary: (params) => [...billingKeys.invoices(), 'summary', params],
  profiles: () => [...billingKeys.all, 'profiles'],
  profileList: (params) => [...billingKeys.profiles(), 'list', params],
  modes: () => [...billingKeys.profiles(), 'modes'],
  leaves: () => [...billingKeys.all, 'leaves'],
  leaveList: (params) => [...billingKeys.leaves(), 'list', params],
  discounts: () => [...billingKeys.all, 'discounts'],
  discountList: (params) => [...billingKeys.discounts(), 'list', params],
};

// ── Invoices ──────────────────────────────────────────────────────────

export function useBillingInvoiceList(params = {}) {
  return useQuery({
    queryKey: billingKeys.invoiceList(params),
    queryFn: async () => {
      const res = await billingInvoicesService.getAll(params);
      const body = unwrap(res);
      const list = Array.isArray(body) ? body : (body?.results ?? body?.data ?? []);
      const meta = body?.meta || (body?.count !== undefined
        ? { total: body.count, total_pages: Math.ceil(body.count / (params.page_size || 20)), per_page: params.page_size || 20 }
        : { total: list.length, total_pages: 1, per_page: list.length });
      return { items: Array.isArray(list) ? list : [], meta };
    },
    placeholderData: keepPreviousData,
  });
}

export function useBillingInvoiceSummary(params = {}) {
  return useQuery({
    queryKey: billingKeys.invoiceSummary(params),
    queryFn: async () => unwrap(await billingInvoicesService.summary(params)),
  });
}

export function useGenerateInvoices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => billingInvoicesService.generate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.invoices() });
      notify.success("Hisob-faktura yaratildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useGenerateGroupInvoices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => billingInvoicesService.generateGroup(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.invoices() });
      notify.success("Guruh uchun hisob-fakturalar yaratildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => billingInvoicesService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.invoices() });
      notify.success("Hisob-faktura bekor qilindi");
    },
    onError: (e) => notify.error(e),
  });
}

// ── Profiles ──────────────────────────────────────────────────────────

export function useBillingProfileList(params = {}) {
  return useQuery({
    queryKey: billingKeys.profileList(params),
    queryFn: async () => unwrapList(await billingProfilesService.getAll(params)),
  });
}

export function useBillingModes() {
  return useQuery({
    queryKey: billingKeys.modes(),
    queryFn: async () => {
      const res = await billingProfilesService.modes();
      return unwrap(res) ?? [];
    },
  });
}

export function useCreateBillingProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => billingProfilesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.profiles() });
      notify.success("Billing profili yaratildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useUpdateBillingProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => billingProfilesService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.profiles() });
      notify.success("Billing profili yangilandi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useDeleteBillingProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => billingProfilesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.profiles() });
      notify.success("Billing profili o'chirildi");
    },
    onError: (e) => notify.error(e),
  });
}

// ── Leaves ────────────────────────────────────────────────────────────

export function useBillingLeaveList(params = {}) {
  return useQuery({
    queryKey: billingKeys.leaveList(params),
    queryFn: async () => {
      const res = await billingLeavesService.getAll(params);
      const body = unwrap(res);
      const list = Array.isArray(body) ? body : (body?.results ?? []);
      const meta = body?.meta || (body?.count !== undefined
        ? { total: body.count, total_pages: Math.ceil(body.count / (params.page_size || 20)) }
        : { total: list.length, total_pages: 1 });
      return { items: list, meta };
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateBillingLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => billingLeavesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.leaves() });
      notify.success("Sababli davomat yaratildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useUpdateBillingLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => billingLeavesService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.leaves() });
      notify.success("Yangilandi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useDeleteBillingLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => billingLeavesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.leaves() });
      notify.success("O'chirildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useApproveBillingLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => billingLeavesService.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.leaves() });
      notify.success("Tasdiqlandi");
    },
    onError: (e) => notify.error(e),
  });
}

// ── Discounts ─────────────────────────────────────────────────────────

export function useBillingDiscountList(params = {}) {
  return useQuery({
    queryKey: billingKeys.discountList(params),
    queryFn: async () => unwrapList(await billingDiscountsService.getAll(params)),
  });
}

export function useCreateBillingDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => billingDiscountsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.discounts() });
      notify.success("Chegirma yaratildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useUpdateBillingDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => billingDiscountsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.discounts() });
      notify.success("Chegirma yangilandi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useDeleteBillingDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => billingDiscountsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.discounts() });
      notify.success("Chegirma o'chirildi");
    },
    onError: (e) => notify.error(e),
  });
}
