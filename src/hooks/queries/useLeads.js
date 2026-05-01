import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { leadsService, leadActivitiesService } from '@/services/leads';
import { unwrap, unwrapList } from '@/services/api';
import { notify } from '@/lib/notify';

export const leadKeys = {
  all: ['leads'],
  lists: () => [...leadKeys.all, 'list'],
  list: (params) => [...leadKeys.lists(), params],
  details: () => [...leadKeys.all, 'detail'],
  detail: (id) => [...leadKeys.details(), id],
  activities: () => [...leadKeys.all, 'activities'],
  activity: (params) => [...leadKeys.activities(), params],
};

export function useLeadsList(params = {}) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: async () => {
      const res = await leadsService.getAll(params);
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

export function useLead(id) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: async () => unwrap(await leadsService.getById(id)),
    enabled: !!id,
  });
}

export function useLeadActivities(params = {}) {
  return useQuery({
    queryKey: leadKeys.activity(params),
    queryFn: async () => unwrapList(await leadActivitiesService.getAll(params)),
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => leadsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadKeys.all });
      notify.success("Lead qo'shildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => leadsService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: leadKeys.all });
      qc.invalidateQueries({ queryKey: leadKeys.detail(id) });
      notify.success("Lead yangilandi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => leadsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadKeys.all });
      notify.success("Lead o'chirildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useCreateLeadActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => leadActivitiesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadKeys.activities() });
      notify.success("Faoliyat qo'shildi");
    },
    onError: (e) => notify.error(e),
  });
}
