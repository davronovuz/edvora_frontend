import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { teachersService } from '@/services/teachers';
import { unwrap, unwrapList } from '@/services/api';
import { notify } from '@/lib/notify';

export const teacherKeys = {
  all: ['teachers'],
  lists: () => [...teacherKeys.all, 'list'],
  list: (params) => [...teacherKeys.lists(), params],
  details: () => [...teacherKeys.all, 'detail'],
  detail: (id) => [...teacherKeys.details(), id],
  groups: (id) => [...teacherKeys.detail(id), 'groups'],
};

export function useTeachersList(params = {}) {
  return useQuery({
    queryKey: teacherKeys.list(params),
    queryFn: async () => {
      const res = await teachersService.getAll(params);
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

export function useTeacher(id) {
  return useQuery({
    queryKey: teacherKeys.detail(id),
    queryFn: async () => unwrap(await teachersService.getById(id)),
    enabled: !!id,
  });
}

export function useTeacherGroups(id) {
  return useQuery({
    queryKey: teacherKeys.groups(id),
    queryFn: async () => unwrapList(await teachersService.getGroups(id)),
    enabled: !!id,
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => teachersService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teacherKeys.all });
      notify.success("O'qituvchi qo'shildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => teachersService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: teacherKeys.all });
      qc.invalidateQueries({ queryKey: teacherKeys.detail(id) });
      notify.success("O'qituvchi yangilandi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => teachersService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teacherKeys.all });
      notify.success("O'qituvchi o'chirildi");
    },
    onError: (e) => notify.error(e),
  });
}
