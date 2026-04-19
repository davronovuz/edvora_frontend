import { useAuthStore } from '@/stores/authStore';

/**
 * Rol va permission tekshiruvlari uchun yagona hook.
 * user?.role === 'owner' ni hamma faylda yozish o'rniga
 * shu hookdan foydalaning.
 */
export function usePermissions() {
  const { user, hasPermission } = useAuthStore();
  const role = user?.role;

  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const isAccountant = role === 'accountant';
  const isRegistrar = role === 'registrar';

  const isOwnerOrAdmin = isOwner || isAdmin;

  return {
    role,
    isOwner,
    isAdmin,
    isTeacher,
    isAccountant,
    isRegistrar,
    isOwnerOrAdmin,

    // CRUD ruxsatlari — resurs nomi bilan
    can: (action, resource) => {
      if (isOwner) return true;
      return hasPermission(`${resource}.${action}`);
    },

    // Tezkor tekshiruvlar — eng ko'p ishlatiladigan
    canView: (resource) => isOwner || hasPermission(`${resource}.view`),
    canCreate: (resource) => isOwner || hasPermission(`${resource}.create`),
    canUpdate: (resource) => isOwner || hasPermission(`${resource}.update`),
    canDelete: (resource) => isOwner || hasPermission(`${resource}.delete`),

    // Legacy: to'g'ridan-to'g'ri hasPermission
    hasPermission,
  };
}
