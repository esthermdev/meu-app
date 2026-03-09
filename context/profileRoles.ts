import { Database } from '@/database.types';
import { supabase } from '@/lib/supabase';

export type RoleKey = 'user' | 'admin' | 'medic' | 'driver' | 'volunteer';
export type PermissionKey =
  | 'view_admin_dashboard'
  | 'manage_games'
  | 'manage_transport'
  | 'manage_water'
  | 'manage_trainer_requests'
  | 'receive_cart_notifications'
  | 'receive_water_notifications'
  | 'receive_medic_notifications';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type ProfileRoleJoin = {
  role?: {
    key: string | null;
    name: string | null;
  } | null;
};

type RoleAwareProfile = ProfileWithRole | (ProfileRow & ProfileRoleJoin);

export type ProfileWithRole = ProfileRow &
  ProfileRoleJoin & {
    role_key: RoleKey | null;
    role_name: string | null;
    role_keys: RoleKey[];
    permission_keys: PermissionKey[];
  };

const DEFAULT_ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  user: [],
  admin: [
    'view_admin_dashboard',
    'manage_games',
    'manage_transport',
    'manage_water',
    'manage_trainer_requests',
    'receive_cart_notifications',
    'receive_water_notifications',
    'receive_medic_notifications',
  ],
  driver: ['manage_transport', 'receive_cart_notifications'],
  volunteer: ['manage_water', 'receive_water_notifications'],
  medic: ['manage_trainer_requests', 'receive_medic_notifications'],
};

function isRoleKey(value: string | null | undefined): value is RoleKey {
  return (
    value === 'user' ||
    value === 'admin' ||
    value === 'medic' ||
    value === 'driver' ||
    value === 'volunteer'
  );
}

export function getRoleKey(profile: RoleAwareProfile | null | undefined): RoleKey | null {
  if (!profile) return null;

  if ('role_key' in profile && profile.role_key) {
    return profile.role_key;
  }

  if ('role' in profile && isRoleKey(profile.role?.key)) {
    return profile.role.key;
  }

  return null;
}

export function getRoleKeys(profile: RoleAwareProfile | null | undefined): RoleKey[] {
  if (!profile) return [];

  if ('role_keys' in profile && Array.isArray(profile.role_keys) && profile.role_keys.length > 0) {
    return profile.role_keys;
  }

  const fallback = getRoleKey(profile);
  return fallback ? [fallback] : [];
}

export function hasRole(profile: RoleAwareProfile | null | undefined, role: RoleKey): boolean {
  return getRoleKeys(profile).includes(role);
}

export function hasPermission(
  profile: RoleAwareProfile | null | undefined,
  permission: PermissionKey,
): boolean {
  if (!profile) return false;

  if (
    'permission_keys' in profile &&
    Array.isArray(profile.permission_keys) &&
    profile.permission_keys.length > 0
  ) {
    return profile.permission_keys.includes(permission);
  }

  const roleKeys = getRoleKeys(profile);
  for (const role of roleKeys) {
    if (DEFAULT_ROLE_PERMISSIONS[role]?.includes(permission)) {
      return true;
    }
  }

  return false;
}

export async function fetchProfileWithRole(userId: string): Promise<ProfileWithRole | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, role:roles!profiles_role_id_fkey(key,name)')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const rawProfile = data as ProfileRow & ProfileRoleJoin;
  const roleKey = isRoleKey(rawProfile.role?.key) ? rawProfile.role.key : null;

  const { data: accessData, error: accessError } = await (supabase as any).rpc(
    'get_profile_access',
    {
      p_profile_id: userId,
    },
  );

  if (accessError) {
    throw accessError;
  }

  const accessRow = Array.isArray(accessData) ? accessData[0] : accessData;
  const roleKeys = Array.isArray(accessRow?.role_keys)
    ? accessRow.role_keys.filter((key: string) => isRoleKey(key))
    : [];
  const permissionKeys = Array.isArray(accessRow?.permission_keys)
    ? (accessRow.permission_keys as PermissionKey[])
    : [];

  return {
    ...rawProfile,
    role_key: roleKey,
    role_name: rawProfile.role?.name ?? null,
    role_keys: roleKeys.length > 0 ? roleKeys : roleKey ? [roleKey] : ['user'],
    permission_keys: permissionKeys,
  };
}
