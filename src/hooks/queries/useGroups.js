import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { groupsService } from '@/services/groups';
import { unwrap, unwrapList } from '@/services/api';
import { notify } from '@/lib/notify';
import { studentKeys } from './useStudents';

export const groupKeys = {
  all: ['groups'],
  lists: () => [...groupKeys.all, 'list'],
  list: (params) => [...groupKeys.lists(), params],
  details: () => [...groupKeys.all, 'detail'],
  detail: (id) => [...groupKeys.details(), id],
  students: (id) => [...groupKeys.detail(id), 'students'],
  summary: (id) => [...groupKeys.detail(id), 'summary'],
  scheduleConflicts: () => [...groupKeys.all, 'schedule-conflicts'],
};

export function useGroupsList(params = {}) {
  return useQuery({
    queryKey: groupKeys.list(params),
    queryFn: async () => {
      const res = await groupsService.getAll(params);
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

export function useGroup(id) {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: async () => unwrap(await groupsService.getById(id)),
    enabled: !!id,
  });
}

export function useGroupStudents(id) {
  return useQuery({
    queryKey: groupKeys.students(id),
    queryFn: async () => unwrapList(await groupsService.getStudents(id)),
    enabled: !!id,
  });
}

export function useGroupSummary(id) {
  return useQuery({
    queryKey: groupKeys.summary(id),
    queryFn: async () => unwrap(await groupsService.getSummary(id)),
    enabled: !!id,
  });
}

export function useScheduleConflicts() {
  return useQuery({
    queryKey: groupKeys.scheduleConflicts(),
    queryFn: async () => unwrapList(await groupsService.getScheduleConflicts()),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => groupsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      notify.success("Guruh qo'shildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => groupsService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      qc.invalidateQueries({ queryKey: groupKeys.detail(id) });
      notify.success("Guruh yangilandi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => groupsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      notify.success("Guruh o'chirildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useAddStudentToGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => groupsService.addStudent(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      qc.invalidateQueries({ queryKey: studentKeys.all });
      notify.success("O'quvchi qo'shildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useRemoveStudentFromGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, studentId }) => groupsService.removeStudent(groupId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      qc.invalidateQueries({ queryKey: studentKeys.all });
      notify.success("O'quvchi chiqarildi");
    },
    onError: (e) => notify.error(e),
  });
}

export function useTransferStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => groupsService.transferStudent(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      qc.invalidateQueries({ queryKey: studentKeys.all });
      notify.success("O'quvchi ko'chirildi");
    },
    onError: (e) => notify.error(e),
  });
}
