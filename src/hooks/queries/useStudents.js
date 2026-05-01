import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { studentsService, tagsService } from '@/services/students';
import { unwrap, unwrapList } from '@/services/api';
import { notify } from '@/lib/notify';

export const studentKeys = {
  all: ['students'],
  lists: () => [...studentKeys.all, 'list'],
  list: (params) => [...studentKeys.lists(), params],
  details: () => [...studentKeys.all, 'detail'],
  detail: (id) => [...studentKeys.details(), id],
  statistics: () => [...studentKeys.all, 'statistics'],
  groups: (id) => [...studentKeys.detail(id), 'groups'],
  progress: (id) => [...studentKeys.detail(id), 'progress'],
  transferHistory: (id) => [...studentKeys.detail(id), 'transfer-history'],
  tags: (id) => [...studentKeys.detail(id), 'tags'],
};

export function useStudentsList(params = {}) {
  return useQuery({
    queryKey: studentKeys.list(params),
    queryFn: async () => {
      const res = await studentsService.getAll(params);
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

export function useStudent(id) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: async () => unwrap(await studentsService.getById(id)),
    enabled: !!id,
  });
}

export function useStudentStatistics() {
  return useQuery({
    queryKey: studentKeys.statistics(),
    queryFn: async () => unwrap(await studentsService.getStatistics()),
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => studentsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.all });
      notify.success("O'quvchi qo'shildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => studentsService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: studentKeys.all });
      qc.invalidateQueries({ queryKey: studentKeys.detail(id) });
      notify.success("Yangilandi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => studentsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.all });
      notify.success("O'chirildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useFreezeStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => studentsService.freeze(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.all });
      notify.success("Muzlatildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useUnfreezeStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => studentsService.unfreeze(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.all });
      notify.success("Muzlatish bekor qilindi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useArchiveStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => studentsService.archive(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.all });
      notify.success("Arxivlandi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useStudentGroups(id) {
  return useQuery({
    queryKey: studentKeys.groups(id),
    queryFn: async () => unwrapList(await studentsService.getGroups(id)),
    enabled: !!id,
  });
}

export function useStudentProgress(id) {
  return useQuery({
    queryKey: studentKeys.progress(id),
    queryFn: async () => unwrap(await studentsService.getProgressSummary(id)),
    enabled: !!id,
  });
}

export function useStudentTransferHistory(id) {
  return useQuery({
    queryKey: studentKeys.transferHistory(id),
    queryFn: async () => unwrapList(await studentsService.getTransferHistory(id)),
    enabled: !!id,
  });
}

export function useStudentTags(id) {
  return useQuery({
    queryKey: studentKeys.tags(id),
    queryFn: async () => unwrapList(await studentsService.getTags(id)),
    enabled: !!id,
  });
}
