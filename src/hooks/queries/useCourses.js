import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { coursesService } from '@/services/courses';
import { unwrap, unwrapList } from '@/services/api';
import { notify } from '@/lib/notify';

export const courseKeys = {
  all: ['courses'],
  lists: () => [...courseKeys.all, 'list'],
  list: (params) => [...courseKeys.lists(), params],
  details: () => [...courseKeys.all, 'detail'],
  detail: (id) => [...courseKeys.details(), id],
};

export function useCoursesList(params = {}) {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: async () => {
      const res = await coursesService.getAll(params);
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

export function useCourse(id) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: async () => unwrap(await coursesService.getById(id)),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => coursesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.all });
      notify.success("Kurs qo'shildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => coursesService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: courseKeys.all });
      qc.invalidateQueries({ queryKey: courseKeys.detail(id) });
      notify.success("Kurs yangilandi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => coursesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.all });
      notify.success("Kurs o'chirildi");
    },
    onError: (e) => notify.error(e),
  });
}
