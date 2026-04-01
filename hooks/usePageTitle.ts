import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Casas En El Paso TX`;
  }, [title]);
}
