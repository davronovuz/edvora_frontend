import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { groupsService } from '@/services/groups';
import { coursesService } from '@/services/courses';
import { teachersService } from '@/services/teachers';
import { studentsService } from '@/services/students';
import { roomsService } from '@/services/rooms';
import { unwrap, unwrapList } from '@/services/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const PER_PAGE = 12;

/**
 * Guruhlar ro'yxati uchun data fetching hook.
 */
export function useGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, total_pages: 1 });
  const [stats, setStats] = useState({ total: 0, active: 0, forming: 0, completed: 0 });

  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');

  const search = useDebouncedValue(searchInput, 350);

  // Meta (lookup) state
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: PER_PAGE };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (courseFilter) params.course = courseFilter;
      if (teacherFilter) params.teacher = teacherFilter;

      const res = await groupsService.getAll(params);
      const body = unwrap(res);
      const list = Array.isArray(body) ? body : (body?.results ?? body?.data ?? []);
      setGroups(Array.isArray(list) ? list : []);
      const m = body?.meta || {};
      if (m.total !== undefined) setMeta(m);
      else if (body?.count !== undefined) {
        setMeta({ total: body.count, total_pages: Math.ceil(body.count / PER_PAGE), page });
      }
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, courseFilter, teacherFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await groupsService.getAll({ page_size: 1 });
      const body = unwrap(res);
      const total = body?.meta?.total || body?.count || 0;
      const [active, forming, completed] = await Promise.allSettled([
        groupsService.getAll({ status: 'active', page_size: 1 }),
        groupsService.getAll({ status: 'forming', page_size: 1 }),
        groupsService.getAll({ status: 'completed', page_size: 1 }),
      ]);
      setStats({
        total,
        active: unwrap(active.value)?.count ?? 0,
        forming: unwrap(forming.value)?.count ?? 0,
        completed: unwrap(completed.value)?.count ?? 0,
      });
    } catch {}
  }, []);

  const fetchLookups = useCallback(async () => {
    try {
      const [c, t, r, s] = await Promise.allSettled([
        coursesService.getAll({ page_size: 200 }),
        teachersService.getAll({ page_size: 200 }),
        roomsService.getAll({ page_size: 100 }),
        studentsService.getAll({ page_size: 500, status: 'active' }),
      ]);
      if (c.status === 'fulfilled') setCourses(unwrapList(c.value));
      if (t.status === 'fulfilled') setTeachers(unwrapList(t.value));
      if (r.status === 'fulfilled') setRooms(unwrapList(r.value));
      if (s.status === 'fulfilled') setAllStudents(unwrapList(s.value));
    } catch {}
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);
  useEffect(() => { fetchStats(); fetchLookups(); }, []);

  return {
    groups, setGroups,
    loading,
    meta,
    stats,
    search,
    searchInput, setSearchInput,
    page, setPage,
    statusFilter, setStatusFilter,
    courseFilter, setCourseFilter,
    teacherFilter, setTeacherFilter,
    courses,
    teachers,
    rooms,
    allStudents,
    refresh: fetchGroups,
  };
}
