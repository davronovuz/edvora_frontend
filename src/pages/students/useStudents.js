import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { studentsService } from '@/services/students';
import { unwrap } from '@/services/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const PER_PAGE = 20;

/**
 * O'quvchilar ro'yxati uchun data fetching hook.
 * Sahifa komponentidan state va server chaqiruvlarini ajratadi.
 */
export function useStudents() {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1, per_page: PER_PAGE });

  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [debtFilter, setDebtFilter] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const search = useDebouncedValue(searchInput, 400);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const controller = new AbortController();
    try {
      const params = { page: currentPage, per_page: PER_PAGE };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (debtFilter === 'debt') params.has_debt = 'true';
      if (sortField) params.ordering = (sortDir === 'desc' ? '-' : '') + sortField;

      const res = await studentsService.getAll(params, { signal: controller.signal });
      const body = unwrap(res);
      const list = Array.isArray(body) ? body : (body?.results ?? body?.data ?? []);
      setStudents(Array.isArray(list) ? list : []);
      if (body?.meta) {
        setMeta(body.meta);
      } else if (body?.count !== undefined) {
        setMeta({ total: body.count, total_pages: Math.ceil(body.count / PER_PAGE), per_page: PER_PAGE });
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      toast.error(err.response?.data?.error?.message || "O'quvchilarni yuklashda xatolik");
      setStudents([]);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [currentPage, search, statusFilter, debtFilter, sortField, sortDir]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await studentsService.getStatistics();
      setStats(unwrap(res));
    } catch {
      // statistika critical emas
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { fetchStats(); }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortField(''); setSortDir('asc'); }
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  return {
    students, setStudents,
    stats,
    loading,
    meta,
    search,
    searchInput, setSearchInput,
    statusFilter, setStatusFilter,
    debtFilter, setDebtFilter,
    sortField, sortDir,
    currentPage, setCurrentPage,
    handleSort,
    refresh: fetchStudents,
    refreshStats: fetchStats,
  };
}
