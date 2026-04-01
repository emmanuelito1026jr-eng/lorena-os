import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../useAuth';

export function useClientNotificationCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['client-notification-count', user?.id],
    queryFn: async (): Promise<number> => {
      // Notifications table only has agent_id (designed for agent alerts).
      // Client notifications will use a separate mechanism in Phase 4.
      // For now, return 0 to avoid querying wrong column.
      return 0;
    },
    enabled: !!user,
  });
}
